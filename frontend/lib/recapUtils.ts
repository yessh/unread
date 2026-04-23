import type { ParsedMessage } from './types'

export interface RecapData {
  firstMessage: { date: Date; sender: string; content: string }
  totalStats: { messageCount: number; dayCount: number; senderCount: number }
  topWords: { word: string; count: number }[]
  monthlyKing: { month: string; sender: string; count: number }[]
  firstSender: { sender: string; count: number; percentage: number }[]
}

const STOPWORDS = new Set([
  'ㅋ', 'ㅎ', 'ㅠ', 'ㅜ', 'ㅡ', 'ㅇ', '이', '가', '을', '를', '은', '는',
  '의', '에', '에서', '와', '과', '도', '로', '으로', '만', '고', '하고',
  '그', '저', '나', '너', '우리', '그냥', '진짜', '완전', '너무', '아',
  '그래', '응', '어', '음', '네', '예', '아니', '맞아', '근데', '그리고',
  '그래서', '근데요', '사진', '이모티콘', '삭제된', '메시지', '보이스메시지',
  '파일', '동영상', '스티커',
])

export function computeRecap(messages: ParsedMessage[]): RecapData {
  if (!messages.length) throw new Error('메시지 없음')

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // 1. 첫 메시지
  const first = sorted[0]
  const firstMessage = { date: first.timestamp, sender: first.sender, content: first.content }

  // 2. 총 통계
  const days = new Set(sorted.map(m => m.timestamp.toDateString()))
  const senders = new Set(sorted.map(m => m.sender))
  const totalStats = {
    messageCount: sorted.length,
    dayCount: days.size,
    senderCount: senders.size,
  }

  // 3. 자주 쓴 단어
  const wordCount: Record<string, number> = {}
  for (const m of sorted) {
    const words = m.content
      .split(/[\s,.!?~ㅋㅎ]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    for (const w of words) {
      wordCount[w] = (wordCount[w] || 0) + 1
    }
  }
  const topWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }))

  // 4. 월별 메시지 왕
  const monthMap: Record<string, Record<string, number>> = {}
  for (const m of sorted) {
    const month = `${m.timestamp.getFullYear()}.${String(m.timestamp.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap[month]) monthMap[month] = {}
    monthMap[month][m.sender] = (monthMap[month][m.sender] || 0) + 1
  }
  const monthlyKing = Object.entries(monthMap).map(([month, counts]) => {
    const [sender, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return { month, sender, count }
  })

  // 5. 먼저 연락한 사람 (날짜별 첫 메시지 발신자)
  const dayFirstSender: Record<string, string> = {}
  for (const m of sorted) {
    const day = m.timestamp.toDateString()
    if (!dayFirstSender[day]) dayFirstSender[day] = m.sender
  }
  const firstSenderCount: Record<string, number> = {}
  for (const sender of Object.values(dayFirstSender)) {
    firstSenderCount[sender] = (firstSenderCount[sender] || 0) + 1
  }
  const total = Object.values(firstSenderCount).reduce((a, b) => a + b, 0)
  const firstSender = Object.entries(firstSenderCount)
    .sort((a, b) => b[1] - a[1])
    .map(([sender, count]) => ({
      sender,
      count,
      percentage: Math.round((count / total) * 100),
    }))

  return { firstMessage, totalStats, topWords, monthlyKing, firstSender }
}
