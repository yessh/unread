'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from '@/components/upload/DropZone'
import { FileTypeGuide } from '@/components/upload/FileTypeGuide'
import { useAnalysis } from '@/context/AnalysisContext'

export default function UploadPage() {
  const router = useRouter()
  const { uploadState, uploadFile, parsedMessages } = useAnalysis()

  useEffect(() => {
    if (uploadState.status === 'done' && parsedMessages) {
      const timer = setTimeout(() => {
        router.push('/recap')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [uploadState.status, parsedMessages, router])

  return (
    <main className="min-h-screen bg-surface-base">
      {/* 헤더 */}
      <section className="border-b border-surface-elevated bg-surface-card/50 px-4 py-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-bold text-content-primary">카카오톡 분석</h1>
          <p className="text-lg text-content-secondary">
            대화 기록을 업로드하면 원하는 시간대를 선택해 요약할 수 있습니다
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 animate-slide-up">
            <DropZone onFileDrop={uploadFile} uploadState={uploadState} />
          </div>
          <FileTypeGuide />
        </div>
      </section>
    </main>
  )
}
