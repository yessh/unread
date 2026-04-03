'use client'

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import type { AiAnalysisResponse, KeywordExtraction, KeywordTag, ParsedMessage, UploadState } from '@/lib/types'
import { parseKakaoTxt } from '@/lib/parseKakaoTxt'
import { parseCsv } from '@/lib/parseCsv'
import { requestFullAnalysis, extractKeywords as extractKeywordsApi } from '@/lib/api'

interface AnalysisState {
  parsedMessages: ParsedMessage[] | null
  sessionId: number | null
  roomName: string | null
  analysisResult: AiAnalysisResponse | null
  uploadState: UploadState
  activeKeywords: KeywordTag[]
  keywordResults: KeywordExtraction[] | null
}

type AnalysisAction =
  | { type: 'SET_PARSED_MESSAGES'; payload: { messages: ParsedMessage[]; roomName: string } }
  | { type: 'SET_SESSION_ID'; payload: number }
  | { type: 'SET_ANALYSIS_RESULT'; payload: AiAnalysisResponse }
  | { type: 'SET_UPLOAD_STATE'; payload: Partial<UploadState> }
  | { type: 'ADD_KEYWORD'; payload: KeywordTag }
  | { type: 'REMOVE_KEYWORD'; payload: string }
  | { type: 'SET_KEYWORD_RESULTS'; payload: KeywordExtraction[] }
  | { type: 'RESET' }

interface AnalysisContextType extends AnalysisState {
  uploadAndAnalyze: (file: File) => Promise<void>
  addKeyword: (text: string) => void
  removeKeyword: (id: string) => void
  extractKeywords: (keywords: string[]) => Promise<void>
  resetAnalysis: () => void
}

const initialState: AnalysisState = {
  parsedMessages: null,
  sessionId: null,
  roomName: null,
  analysisResult: null,
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
    case 'SET_ANALYSIS_RESULT':
      return { ...state, analysisResult: action.payload }
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
      return {
        ...initialState,
        uploadState: { status: 'idle', progress: 0 },
      }
    default:
      return state
  }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const uploadAndAnalyze = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'parsing', progress: 10 } })

      // 파일 파싱
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
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'uploading', progress: 30 } })

      // 백엔드 업로드 (추후 구현)
      // const uploadResult = await uploadChatFile(file)
      // dispatch({ type: 'SET_SESSION_ID', payload: uploadResult.session_id })

      // 임시: mock session ID 사용
      const sessionId = parseInt(process.env.NEXT_PUBLIC_MOCK_SESSION_ID || '1', 10)
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId })

      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'analyzing', progress: 50 } })

      // 전체 분석 요청
      const result = await requestFullAnalysis({
        session_id: sessionId,
      })

      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: result })
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'done', progress: 100 } })

      // sessionStorage에 저장 (새로고침 시 유지)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('analysisResult', JSON.stringify(result))
        sessionStorage.setItem('parsedMessages', JSON.stringify(messages))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      dispatch({ type: 'SET_UPLOAD_STATE', payload: { status: 'error', progress: 0, errorMessage } })
    }
  }, [])

  const extractKeywords = useCallback(async (keywords: string[]) => {
    if (!state.sessionId || keywords.length === 0) return

    try {
      const results = await extractKeywordsApi({
        session_id: state.sessionId,
        keywords,
      })
      dispatch({ type: 'SET_KEYWORD_RESULTS', payload: results })
    } catch (error) {
      console.error('키워드 추출 실패:', error)
    }
  }, [state.sessionId])

  const addKeyword = useCallback((text: string) => {
    const newTag: KeywordTag = {
      id: Date.now().toString(),
      text,
    }
    dispatch({ type: 'ADD_KEYWORD', payload: newTag })
  }, [])

  const removeKeyword = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_KEYWORD', payload: id })
  }, [])

  const resetAnalysis = useCallback(() => {
    dispatch({ type: 'RESET' })
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('analysisResult')
      sessionStorage.removeItem('parsedMessages')
    }
  }, [])

  // 페이지 로드 시 sessionStorage에서 복원
  if (typeof window !== 'undefined' && !state.analysisResult) {
    const savedResult = sessionStorage.getItem('analysisResult')
    const savedMessages = sessionStorage.getItem('parsedMessages')
    if (savedResult) {
      try {
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: JSON.parse(savedResult) })
        if (savedMessages) {
          const messages = JSON.parse(savedMessages).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
          dispatch({ type: 'SET_PARSED_MESSAGES', payload: { messages, roomName: 'Restored' } })
        }
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }

  const value: AnalysisContextType = {
    ...state,
    uploadAndAnalyze,
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
