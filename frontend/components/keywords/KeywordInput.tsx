'use client'

import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import type { KeywordTag } from '@/lib/types'

interface KeywordInputProps {
  keywords: KeywordTag[]
  onAdd: (text: string) => void
  onRemove: (id: string) => void
  onSearch: () => void
  isLoading?: boolean
}

export function KeywordInput({ keywords, onAdd, onRemove, onSearch, isLoading = false }: KeywordInputProps) {
  const [input, setInput] = useState('')

  const handleAddKeyword = (text: string) => {
    if (text.trim() && keywords.length < 10) {
      onAdd(text.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddKeyword(input)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="분석하고 싶은 키워드를 입력하세요 (예: 약속, 면접, 시험)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || keywords.length >= 10}
          className="flex-1"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              handleAddKeyword(input)
            } else {
              onSearch()
            }
          }}
          disabled={isLoading || (keywords.length === 0 && !input.trim())}
          className="rounded-lg bg-accent-primary px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? '검색 중...' : input.trim() ? '추가' : '검색'}
        </button>
      </div>

      {/* 키워드 태그 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((tag) => (
            <Badge
              key={tag.id}
              variant="primary"
              removable
              onRemove={() => onRemove(tag.id)}
            >
              {tag.text}
            </Badge>
          ))}
        </div>
      )}

      {keywords.length >= 10 && (
        <p className="text-sm text-accent-warning">최대 10개까지만 추가 가능합니다</p>
      )}
    </div>
  )
}
