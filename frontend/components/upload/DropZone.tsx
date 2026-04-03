'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { UploadState } from '@/lib/types'

interface DropZoneProps {
  onFileDrop: (file: File) => void
  uploadState: UploadState
}

const STATUS_MESSAGES = {
  idle: '카카오톡 대화를 분석해보세요',
  parsing: '파일 읽는 중...',
  uploading: '서버 전송 중...',
  analyzing: 'AI 분석 중...',
  done: '분석 완료!',
  error: '오류 발생',
}

export function DropZone({ onFileDrop, uploadState }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileDrop(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      onFileDrop(files[0])
    }
  }

  const isLoading = uploadState.status !== 'idle' && uploadState.status !== 'done' && uploadState.status !== 'error'

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={clsx(
        'relative rounded-3xl border-2 border-dashed p-12 transition-all duration-200',
        isDragOver
          ? 'border-accent-primary bg-accent-primary/5 shadow-glow'
          : 'border-surface-elevated bg-surface-card/50',
        isLoading && 'cursor-not-allowed opacity-75',
      )}
    >
      {/* 아이콘 및 텍스트 */}
      <div className="flex-center flex-col gap-6">
        {uploadState.status === 'done' ? (
          <div className="text-6xl">✓</div>
        ) : (
          <svg
            className="h-16 w-16 text-accent-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}

        <div className="text-center">
          <h3 className="mb-2 text-2xl font-bold text-content-primary">
            {STATUS_MESSAGES[uploadState.status]}
          </h3>
          {uploadState.status === 'idle' && (
            <p className="text-content-secondary">.zip (모바일) 또는 .csv (PC) 파일을 끌어오세요</p>
          )}
        </div>

        {/* 로딩 표시 */}
        {isLoading && <LoadingSpinner size="md" />}

        {/* 진행 바 */}
        {isLoading && uploadState.progress > 0 && (
          <div className="w-full max-w-xs rounded-full bg-surface-elevated">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        )}

        {/* 파일 선택 버튼 */}
        {!isLoading && (
          <label className="cursor-pointer">
            <div className="rounded-lg bg-accent-primary px-6 py-3 font-medium text-white transition-opacity hover:opacity-90">
              파일 선택하기
            </div>
            <input
              type="file"
              accept=".zip,.csv"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        )}

        {/* 에러 메시지 */}
        {uploadState.status === 'error' && uploadState.errorMessage && (
          <p className="text-sm text-accent-danger">{uploadState.errorMessage}</p>
        )}
      </div>
    </div>
  )
}
