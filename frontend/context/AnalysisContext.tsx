'use client'

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import type { ConversationSummary, KeywordExtraction, KeywordTag, ParsedMessage, UploadState } from '@/lib/types'
import { parseKakaoTxt } from '@/lib/parseKakaoTxt'
import { parseCsv } from '@/lib/parseCsv'
import { extractKeywords as extractKeywordsApi, summarizeConversation as summarizeApi } from '@/lib/api'

interface AnalysisState {
  parsedMessages: ParsedMessage[] | null
  sessionId: number | null
  roomName: string | null
  summaryResult: ConversationSummary | null
  summaryHours: number | null
  uploadState: UploadState
  activeKeywords: KeywordTag[]
  keywordResults: KeywordExtraction[] | null
}

type AnalysisAction =
  | { type: 'SET_PARSED_MESSAGES'; payload: { messages: ParsedMessage[]; roomName: string } }
  | { type: 'SET_SESSION_ID'; payload: number }
  | { type: 'SET_SUMMARY_RESULT'; payload: { result: ConversationSummary; hours: number } }
  | { type: 'SET_UPLOAD_STATE'; payload: Partial<UploadState> }
  | { type: 'ADD_KEYWORD'; payload: KeywordTag }
  | { type: 'REMOVE_KEYWORD'; payload: string }
  | { type: 'SET_KEYWORD_RESULTS'; payload: KeywordExtraction[] }
  | { type: 'RESET' }

interface AnalysisContextType extends AnalysisState {
  uploadFile: (file: File) => Promise<void>
  summarizeLastHours: (hours: number) => Promise<void>
  summarizeTimeRange: (startTime: Date, endTime: Date) => Promise<void>
  addKeyword: (text: string) => void
  removeKeyword: (id: string) => void
  extractKeywords: (keywords: string[]) => Promise<void>
  resetAnalysis: () => void
}

const initialState: AnalysisState = {
  parsedMessages: null,
  sessionId: null,
  roomName: null,
  summaryResult: null,
  summaryHours: null,
  uploadState: { status: 'idle', progress: 0 },
  activeKeywords: [],
  keywordResults: null,
}

function reducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'SET_PARSED_MESSAGES':
      return {
        ...state,
        parsedMessages: action.payload.messages,
        roomName: action.payload.roomName,
      }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }
    case 'SET_SUMMARY_RESULT':
      return { ...state, summaryResult: action.payload.result, summaryHours: action.payload.hours }
    case 'SET_UPLOAD_STATE':
      return { ...state, uploadState: { ...state.uploadState, ...action.payload } }
    case 'ADD_KEYWORD': {
      const exists = state.activeKeywords.some((k) => k.id === action.payload.id)
      return {
        ...state,
        activeKeywords: exists ? state.activeKeywords : [...state.activeKeywords, action.payload],
      }
    }
    case 'REMOVE_KEYWORD':
      return {
        ...state,
        activeKeywords: state.activeKeywords.filter((k) => k.id !== action.payload),
      }
    case 'SET_KEYWORD_RESULTS':
      return { ...state, keywordResults: action.payload }
    case 'RESET':
      return { ...initialState, uploadState: { status: 'idle', progress: 0 } }
    default:
      return state
  }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // 파일 업로드: 파싱만 하고 대시보드로 이동 (AI 호출 없음)
  const uploadFile = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'parsing', progress: 30 } })

      let messages: ParsedMessage[]
      if (file.name.endsWith('.zip')) {
        messages = await parseKakaoTxt(file)
      } else if (file.name.endsWith('.csv')) {
        messages = await parseCsv(file)
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. .zip 또는 .csv를 사용해주세요.')
      }

      dispatch({
        type: 'SET_PARSED_MESSAGES',
        payload: { messages, roomName: file.name.replace(/\.[^/.]+$/, '') },
      })

      const sessionId = parseInt(process.env.NEXT_PUBLIC_MOCK_SESSION_ID || '1', 10)
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId })

      // sessionStorage에 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('parsedMessages', JSON.stringify(messages))
        sessionStorage.setItem('roomName', file.name.replace(/\.[^/.]+$/, ''))
      }

      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'done', progress: 100 } })
    } catch (error) {
      console.error('[파싱 실패]', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'error', progress: 0, errorMessage } })
    }
  }, [])

  // 최근 N시간 대화 요약 요청
  const summarizeLastHours = useCallback(async (hours: number) => {
    if (!state.parsedMessages || !state.sessionId) return

    const latestTime = Math.max(...state.parsedMessages.map((m) => m.timestamp.getTime()))
    const cutoff = latestTime - hours * 60 * 60 * 1000
    const filtered = state.parsedMessages.filter((m) => m.timestamp.getTime() >= cutoff)

    if (filtered.length === 0) {
      throw new Error(`최근 ${hours}시간 내 메시지가 없습니다.`)
    }

    const messages = filtered.map((m) => ({ sender: m.sender, content: m.content }))
    console.log(`[요약 요청] ${hours}시간 전 ~ 최신 / 메시지 수: ${filtered.length}`)

    const result = await summarizeApi({ session_id: state.sessionId, messages })
    dispatch({ type: 'SET_SUMMARY_RESULT', payload: { result, hours } })
  }, [state.parsedMessages, state.sessionId])

  const summarizeTimeRange = useCallback(async (startTime: Date, endTime: Date) => {
    if (!state.parsedMessages || !state.sessionId) return

    const filtered = state.parsedMessages.filter(
      (m) => m.timestamp >= startTime && m.timestamp < endTime,
    )

    if (filtered.length === 0) {
      throw new Error('선택한 시간대에 메시지가 없습니다.')
    }

    const messages = filtered.map((m) => ({ sender: m.sender, content: m.content }))
    const result = await summarizeApi({ session_id: state.sessionId, messages })
    const diffHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
    dispatch({ type: 'SET_SUMMARY_RESULT', payload: { result, hours: diffHours } })
  }, [state.parsedMessages, state.sessionId])

  const extractKeywords = useCallback(async (keywords: string[]) => {
    if (!state.sessionId || keywords.length === 0) return
    try {
      const results = await extractKeywordsApi({ session_id: state.sessionId, keywords })
      dispatch({ type: 'SET_KEYWORD_RESULTS', payload: results })
    } catch (error) {
      console.error('키워드 추출 실패:', error)
    }
  }, [state.sessionId])

  const addKeyword = useCallback((text: string) => {
    dispatch({ type: 'ADD_KEYWORD', payload: { id: Date.now().toString(), text } })
  }, [])

  const removeKeyword = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_KEYWORD', payload: id })
  }, [])

  const resetAnalysis = useCallback(() => {
    dispatch({ type: 'RESET' })
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('parsedMessages')
      sessionStorage.removeItem('roomName')
    }
  }, [])

  // 페이지 로드 시 sessionStorage에서 복원
  if (typeof window !== 'undefined' && !state.parsedMessages) {
    const savedMessages = sessionStorage.getItem('parsedMessages')
    const savedRoomName = sessionStorage.getItem('roomName')
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages).map((m: ParsedMessage & { timestamp: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        dispatch({
          type: 'SET_PARSED_MESSAGES',
          payload: { messages, roomName: savedRoomName || 'Restored' },
        })
        const sessionId = parseInt(process.env.NEXT_PUBLIC_MOCK_SESSION_ID || '1', 10)
        dispatch({ type: 'SET_SESSION_ID', payload: sessionId })
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }

  const value: AnalysisContextType = {
    ...state,
    uploadFile,
    summarizeLastHours,
    summarizeTimeRange,
    addKeyword,
    removeKeyword,
    extractKeywords,
    resetAnalysis,
  }

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider')
  }
  return context
}
