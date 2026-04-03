// 백엔드 응답 타입 (DTO 매핑)

export interface CoreMessage {
  sender: string
  content: string
  timestamp: string
  relevance: string
}

export interface ConversationSummary {
  period: string
  summary: string
  main_topics: string[]
  message_count: number
  participant_count: number
}

export interface KeywordExtraction {
  keyword: string
  core_messages: CoreMessage[]
  total_count: number
  relevance_score: number
}

export interface LinguisticFeatures {
  sentence_length: string
  formality: string
  expression_style: string
}

export interface ParticipantAnalysis {
  name: string
  personality_summary: string
  communication_style: string
  key_characteristics: string[]
  message_count: number
  message_percentage: number
  emoji_usage_frequency: number
  response_tone: string
  linguistic_features: LinguisticFeatures
  confidence_score: number
}

export interface AiAnalysisResponse {
  session_id: number
  room_name: string
  analysis_timestamp: string
  conversation_summary: ConversationSummary
  keyword_extractions: KeywordExtraction[]
  participant_analyses: ParticipantAnalysis[]
  overall_insights: string
  success: boolean
  error_message?: string
}

// 프론트엔드 내부용 타입

export interface ParsedMessage {
  sender: string
  content: string
  timestamp: Date
}

export interface UploadState {
  status: 'idle' | 'parsing' | 'uploading' | 'analyzing' | 'done' | 'error'
  progress: number
  errorMessage?: string
}

// 차트용 데이터 타입

export interface HourlyChartData {
  hour: string
  count: number
}

export interface ParticipantChartData {
  name: string
  count: number
  percentage: number
}

// 키워드 입력 상태

export interface KeywordTag {
  id: string
  text: string
}
