import type { ParsedMessage } from './types'

export interface RecapData {
  firstMessage: { date: Date; sender: string; content: string }
  totalStats: { messageCount: number; dayCount: number; senderCount: number }
  topWords: { word: string; count: number }[]
  monthlyKing: { month: string; sender: string; count: number }[]
  firstSender: { sender: string; count: number; percentage: number }[]
  nightOwl: { topHours: { hour: number; count: number }[]; isLateNight: boolean }
  longestDay: { date: Date; count: number; firstMsg: string; lastMsg: string }
  foodVsLove: { foodCount: number; loveCount: number; winner: 'food' | 'love' | 'tie' }
  monthRange: { busiest: { month: string; count: number }; quietest: { month: string; count: number } }
}

const STOPWORDS = new Set([
  'ㅋ', 'ㅎ', 'ㅠ', 'ㅜ', 'ㅡ', 'ㅇ', '이', '가', '을', '를', '은', '는',
  '의', '에', '에서', '와', '과', '도', '로', '으로', '만', '고', '하고',
  '그', '저', '나', '너', '우리', '그냥', '진짜', '완전', '너무', '아',
  '그래', '응', '어', '음', '네', '예', '아니', '맞아', '근데', '그리고',
  '그래서', '근데요', '사진', '이모티콘', '삭제된', '메시지', '보이스메시지',
  '파일', '동영상', '스티커',
])

// 음식 관련 — 구체적인 표현만 (bare '먹' 제외)
const FOOD_PATTERNS = [
  /밥\s*(먹|해|줘|먹자|먹고|했|됐)/,
  /먹\s*(자|고|었|을|어|고싶|고 싶)/,
  /뭐\s*먹/,
  /배\s*고\s*파/,
  /식사/,
  /점심|저녁|아침\s*밥/,
  /치킨|피자|라면|떡볶이|삼겹살|순대|국밥|김치찌개|된장/,
  /카페|커피|아아|라떼/,
  /맛있/,
]

// 감정 관련 — 일상 인사말 제외
const LOVE_PATTERNS = [
  /보고\s*싶/,
  /사랑\s*해/,
  /사랑\s*한다/,
  /그리워/,
  /그립다/,
  /보고파/,
  /좋아\s*해/,
  /좋아한다/,
]

function matchesAny(content: string, patterns: RegExp[]) {
  return patterns.some(p => p.test(content))
}

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

  // 5. 먼저 연락한 사람
  const dayFirstSender: Record<string, string> = {}
  for (const m of sorted) {
    const day = m.timestamp.toDateString()
    if (!dayFirstSender[day]) dayFirstSender[day] = m.sender
  }
  const firstSenderCount: Record<string, number> = {}
  for (const sender of Object.values(dayFirstSender)) {
    firstSenderCount[sender] = (firstSenderCount[sender] || 0) + 1
  }
  const totalDays = Object.values(firstSenderCount).reduce((a, b) => a + b, 0)
  const firstSender = Object.entries(firstSenderCount)
    .sort((a, b) => b[1] - a[1])
    .map(([sender, count]) => ({
      sender,
      count,
      percentage: Math.round((count / totalDays) * 100),
    }))

  // 6. 새벽 대화 - 시간대별 피크
  const hourCount: Record<number, number> = {}
  for (const m of sorted) {
    const h = m.timestamp.getHours()
    hourCount[h] = (hourCount[h] || 0) + 1
  }
  const topHours = Object.entries(hourCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([h, count]) => ({ hour: Number(h), count }))
  const peakH = topHours[0].hour
  const nightOwl = {
    topHours,
    isLateNight: peakH >= 22 || peakH <= 4,
  }

  // 7. 최장 대화의 날
  const dayMsgs: Record<string, ParsedMessage[]> = {}
  for (const m of sorted) {
    const day = m.timestamp.toDateString()
    if (!dayMsgs[day]) dayMsgs[day] = []
    dayMsgs[day].push(m)
  }
  const [longestDayKey, longestMsgs] = Object.entries(dayMsgs)
    .sort((a, b) => b[1].length - a[1].length)[0]
  const longestDay = {
    date: new Date(longestDayKey),
    count: longestMsgs.length,
    firstMsg: longestMsgs[0].content.slice(0, 40),
    lastMsg: longestMsgs[longestMsgs.length - 1].content.slice(0, 40),
  }

  // 8. 밥 vs 사랑
  let foodCount = 0
  let loveCount = 0
  for (const m of sorted) {
    if (matchesAny(m.content, FOOD_PATTERNS)) foodCount++
    if (matchesAny(m.content, LOVE_PATTERNS)) loveCount++
  }
  const foodVsLove = {
    foodCount,
    loveCount,
    winner: foodCount > loveCount ? 'food' : loveCount > foodCount ? 'love' : 'tie' as 'food' | 'love' | 'tie',
  }

  // 9. 가장 활발한 달 vs 조용한 달
  const monthTotals = Object.entries(monthMap).map(([month, counts]) => ({
    month,
    count: Object.values(counts).reduce((a, b) => a + b, 0),
  }))
  const busiest = monthTotals.sort((a, b) => b.count - a.count)[0]
  const quietest = monthTotals.sort((a, b) => a.count - b.count)[0]
  const monthRange = { busiest, quietest }

  return { firstMessage, totalStats, topWords, monthlyKing, firstSender, nightOwl, longestDay, foodVsLove, monthRange }
}
