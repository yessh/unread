import type { ConversationSummary, KeywordExtraction } from './types'

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
    credentials: 'include',
    ...options,
  })

  if (response.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, '로그인이 필요합니다')
  }

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

// 세션 목록 조회
export interface ChatSessionSummary {
  id: number
  roomName: string
  fileName: string
  uploadedAt: string
  messageCount: number
}

export async function getSessions(): Promise<ChatSessionSummary[]> {
  return apiFetch<ChatSessionSummary[]>('/chat/sessions')
}

// 세션 메시지 조회
export async function deleteSession(sessionId: number): Promise<void> {
  const url = `${BASE_URL}/chat/sessions/${sessionId}`
  const response = await fetch(url, { method: 'DELETE', credentials: 'include' })
  if (!response.ok) throw new ApiError(response.status, `삭제 실패: ${response.status}`)
}

export async function getSessionMessages(sessionId: number): Promise<Array<{ sender: string; content: string; timestamp: string }>> {
  return apiFetch<Array<{ sender: string; content: string; timestamp: string }>>(`/chat/sessions/${sessionId}/messages`)
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
