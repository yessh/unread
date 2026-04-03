'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from '@/components/upload/DropZone'
import { FileTypeGuide } from '@/components/upload/FileTypeGuide'
import { useAnalysis } from '@/context/AnalysisContext'

export default function UploadPage() {
  const router = useRouter()
  const { uploadState, uploadAndAnalyze, analysisResult } = useAnalysis()

  useEffect(() => {
    if (uploadState.status === 'done' && analysisResult) {
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [uploadState.status, analysisResult, router])

  return (
    <main className="min-h-screen bg-surface-base">
      {/* 헤더 */}
      <section className="border-b border-surface-elevated bg-surface-card/50 px-4 py-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-bold text-content-primary">카카오톡 분석</h1>
          <p className="text-lg text-content-secondary">
            대화 기록을 업로드하고 AI가 자동으로 분석해드립니다
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* 드롭존 */}
          <div className="mb-12 animate-slide-up">
            <DropZone onFileDrop={uploadAndAnalyze} uploadState={uploadState} />
          </div>

          {/* 가이드 */}
          <FileTypeGuide />
        </div>
      </section>
    </main>
  )
}
