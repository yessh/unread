'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { InsightBanner } from '@/components/dashboard/InsightBanner'
import { HourlyFrequencyChart } from '@/components/charts/HourlyFrequencyChart'
import { ParticipantShareChart } from '@/components/charts/ParticipantShareChart'
import { KeywordInput } from '@/components/keywords/KeywordInput'
import { KeywordResultList } from '@/components/keywords/KeywordResultList'
import { ParticipantCardGrid } from '@/components/participants/ParticipantCardGrid'
import { useAnalysis } from '@/context/AnalysisContext'
import { buildHourlyData, buildParticipantData } from '@/lib/chartUtils'
import type { KeywordTag } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const { analysisResult, parsedMessages, activeKeywords, keywordResults, extractKeywords, addKeyword, removeKeyword } =
    useAnalysis()
  const [isLoading, setIsLoading] = useState(false)

  // 로그인 필수
  useEffect(() => {
    if (!analysisResult) {
      router.push('/upload')
    }
  }, [analysisResult, router])

  const hourlyData = useMemo(() => {
    if (!parsedMessages) return []
    return buildHourlyData(parsedMessages)
  }, [parsedMessages])

  const participantData = useMemo(() => {
    if (!analysisResult?.participant_analyses) return []
    return buildParticipantData(analysisResult.participant_analyses)
  }, [analysisResult?.participant_analyses])

  const handleAddKeyword = (text: string) => {
    if (activeKeywords.some((k) => k.text.toLowerCase() === text.toLowerCase())) {
      return
    }
    addKeyword(text)
  }

  const handleRemoveKeyword = (id: string) => {
    removeKeyword(id)
  }

  const handleSearchKeywords = async () => {
    if (activeKeywords.length === 0 || !analysisResult) return
    setIsLoading(true)
    try {
      await extractKeywords(activeKeywords.map((k) => k.text))
    } finally {
      setIsLoading(false)
    }
  }

  if (!analysisResult) {
    return null // 리디렉션 중
  }

  return (
    <main className="min-h-screen bg-surface-base">
      {/* 헤더 */}
      <section className="border-b border-surface-elevated bg-surface-card/50 px-4 py-12 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-bold text-content-primary">분석 결과</h1>
          <p className="text-lg text-content-secondary">
            카카오톡 대화를 AI가 분석한 결과를 확인해보세요
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* 1. 대화 요약 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-content-primary">1️⃣ 대화 요약</h2>
            <SummaryCard
              summary={analysisResult.conversation_summary}
              roomName={analysisResult.room_name}
              analysisTimestamp={analysisResult.analysis_timestamp}
            />
          </div>

          {/* 2. 통찰 배너 */}
          <div>
            <InsightBanner insights={analysisResult.overall_insights} />
          </div>

          {/* 3. 채팅 통계 차트 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-content-primary">2️⃣ 채팅 통계</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <HourlyFrequencyChart data={hourlyData} />
              <ParticipantShareChart data={participantData} />
            </div>
          </div>

          {/* 4. 키워드 분석 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-content-primary">3️⃣ 키워드 분석</h2>
            <div className="space-y-6">
              <div className="card">
                <KeywordInput
                  keywords={activeKeywords}
                  onAdd={handleAddKeyword}
                  onRemove={handleRemoveKeyword}
                  onSearch={handleSearchKeywords}
                  isLoading={isLoading}
                />
              </div>
              <KeywordResultList results={keywordResults || analysisResult.keyword_extractions} />
            </div>
          </div>

          {/* 5. 참여자 분석 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-content-primary">4️⃣ 참여자 분석</h2>
            <ParticipantCardGrid participants={analysisResult.participant_analyses} />
          </div>
        </div>
      </section>
    </main>
  )
}
