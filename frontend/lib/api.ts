import type { ConversationSummary, KeywordExtraction, ParticipantAnalysis } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new ApiError(response.status, `API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// 키워드 추출 API
export async function extractKeywords(req: {
  session_id: number
  keywords: string[]
}): Promise<KeywordExtraction[]> {
  return apiFetch<KeywordExtraction[]>('/analysis/extract-keywords', {
    method: 'POST',
    body: JSON.stringify({
      session_id: req.session_id,
      keywords: req.keywords,
    }),
  })
}

// 기간별 요약 API
export async function summarizeConversation(req: {
  session_id: number
  start_time: string
  end_time: string
  messages: Array<{ sender: string; content: string }>
}): Promise<ConversationSummary> {
  return apiFetch<ConversationSummary>('/analysis/summarize', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// 단일 참여자 분석 API (온디맨드, 내용만 전달)
export async function analyzeParticipant(req: {
  participant_name: string
  messages: string[] // content only
  total_messages: number
}): Promise<ParticipantAnalysis> {
  return apiFetch<ParticipantAnalysis>('/analysis/analyze-participant', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// 단일 참여자 분석 API - SSE 스트리밍 (onToken: 청크 도착, onDone: 전체 텍스트 완료, onError: 오류)
// 반환값은 스트림 취소 함수
export function analyzeParticipantStream(
  req: {
    participant_name: string
    messages: string[]
    total_messages: number
  },
  onToken: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: Error) => void
): () => void {
  const controller = new AbortController()

  fetch(`${BASE_URL}/analysis/analyze-participant/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError(response.status, `Streaming API error: ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE 프레임은 이중 줄바꿈으로 구분
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          let eventName = 'token'
          const dataLines: string[] = []

          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLines.push(line.slice(5))
          }

          const eventData = dataLines.join('\n')

          if (eventName === 'token' && eventData) {
            accumulated += eventData
            onToken(eventData)
          } else if (eventName === 'done') {
            onDone(accumulated)
          } else if (eventName === 'error') {
            onError(new Error(eventData || '스트리밍 분석 실패'))
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    })

  return () => controller.abort()
}

// 메시지 저장 + 임베딩 트리거 API
export async function saveMessages(req: {
  room_name: string
  file_name: string
  messages: Array<{ sender: string; content: string; timestamp: string }>
}): Promise<{ session_id: number }> {
  return apiFetch<{ session_id: number }>('/chat/save', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// 임베딩 진행 상태 조회 API
export interface EmbeddingProgress {
  status: 'IDLE' | 'IN_PROGRESS' | 'DONE' | 'FAILED'
  total: number
  done: number
  percent: number
}

export async function getEmbedStatus(sessionId: number): Promise<EmbeddingProgress> {
  return apiFetch<EmbeddingProgress>(`/vector/embed-status/${sessionId}`)
}

// 벡터 유사도 검색 API
export interface VectorSearchResult {
  id: number
  sessionId: number
  senderName: string
  messageContent: string
  messageTime: string
  messageType: string
}

export async function vectorSearch(req: {
  sessionId: number
  query: string
  limit?: number
}): Promise<VectorSearchResult[]> {
  const params = new URLSearchParams({
    sessionId: String(req.sessionId),
    query: req.query,
    ...(req.limit ? { limit: String(req.limit) } : {}),
  })
  return apiFetch<VectorSearchResult[]>(`/vector/search?${params}`)
}

export interface RagSearchResult {
  answer: string
  retrievedCount: number
  sources: VectorSearchResult[]
}

export async function ragSearch(req: {
  sessionId: number
  query: string
  limit?: number
}): Promise<RagSearchResult> {
  const params = new URLSearchParams({
    sessionId: String(req.sessionId),
    query: req.query,
    ...(req.limit ? { limit: String(req.limit) } : {}),
  })
  return apiFetch<RagSearchResult>(`/vector/rag-search?${params}`)
}

// 파일 업로드 API (추후 구현 시 사용)
export async function uploadChatFile(file: File): Promise<{ session_id: number; room_name: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const url = `/api/chat/upload`
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new ApiError(response.status, `Upload failed: ${error}`)
  }

  return response.json()
}
