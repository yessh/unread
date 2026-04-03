import type { AiAnalysisResponse, ConversationSummary, KeywordExtraction, ParticipantAnalysis } from './types'

const BASE_URL = '/api'

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

// 전체 분석 API
export async function requestFullAnalysis(req: {
  session_id: number
  start_time?: string
  end_time?: string
  keywords?: string[]
}): Promise<AiAnalysisResponse> {
  return apiFetch<AiAnalysisResponse>('/analysis/full-analysis', {
    method: 'POST',
    body: JSON.stringify({
      session_id: req.session_id,
      start_time: req.start_time,
      end_time: req.end_time,
      keywords: req.keywords || [],
    }),
  })
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
  start_time?: string
  end_time?: string
}): Promise<ConversationSummary> {
  return apiFetch<ConversationSummary>('/analysis/summarize', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// 참여자 분석 API
export async function analyzeParticipants(
  sessionId: number,
): Promise<ParticipantAnalysis[]> {
  return apiFetch<ParticipantAnalysis[]>('/analysis/analyze-participants', {
    method: 'POST',
  })
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
