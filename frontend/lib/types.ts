// 인증 타입
export interface AuthUser {
  id: number
  email: string
  username: string
  provider: string
}

// 백엔드 응답 타입 (DTO 매핑)

export interface CoreMessage {
  sender: string
  content: string
  timestamp: string
  relevance: string
}

export interface AttendeeEvidence {
  name: string
  messages: { sender: string; content: string }[]
}

export interface ScheduleInfo {
  event: string | null
  status?: string | null
  location: string | null
  time: string | null
  attendees?: string[]
  latecomers?: string[]
  attendee_evidence?: AttendeeEvidence[]
}

export interface FactInfo {
  category: string
  content: string
}

export interface ConversationTreeNode {
  id: string
  title: string
  description: string
  parent_ids: string[]
  child_ids: string[]
  schedules?: ScheduleInfo[]
  facts?: FactInfo[]
}

export interface ConversationSummary {
  period: string
  summary: string
  main_topics: string[]
  tree_nodes?: ConversationTreeNode[]
  message_count: number
  participant_count: number
  participants?: string[]
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

export type StreamingStatus = 'idle' | 'streaming' | 'done' | 'error'

// 차트용 데이터 타입

export interface HourlyChartData {
  hour: string
  count: number
}

export interface MonthlyChartData {
  month: string
  count: number
}

export interface ParticipantChartData {
  name: string
  count: number
  percentage: number
}

export interface DayOfWeekChartData {
  day: string
  count: number
}

// 키워드 입력 상태

export interface KeywordTag {
  id: string
  text: string
}
