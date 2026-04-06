import type { DayOfWeekChartData, HourlyChartData, MonthlyChartData, ParticipantAnalysis, ParticipantChartData, ParsedMessage } from './types'

export function buildHourlyData(messages: ParsedMessage[]): HourlyChartData[] {
  const hourCounts: Record<number, number> = {}

  // 0~23시 초기화
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0
  }

  // 시간대별 집계
  for (const msg of messages) {
    const hour = msg.timestamp.getHours()
    hourCounts[hour]++
  }

  const total = messages.length || 1

  // 차트 데이터 변환 (비율 %)
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}시`,
    count: Math.round((hourCounts[i] / total) * 1000) / 10,
  }))
}

export function buildWeeklyData(messages: ParsedMessage[]): MonthlyChartData[] {
  const weekCounts: Record<string, number> = {}

  for (const msg of messages) {
    const d = new Date(msg.timestamp)
    const day = d.getDay() // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day // 월요일로 맞춤
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    weekCounts[key] = (weekCounts[key] || 0) + 1
  }

  const total = messages.length || 1

  return Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [, month, day] = key.split('-')
      return { month: `${month}/${day}`, count: Math.round((count / total) * 1000) / 10 }
    })
}

export function buildDayOfWeekData(messages: ParsedMessage[]): DayOfWeekChartData[] {
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  const counts = Array(7).fill(0)
  for (const msg of messages) {
    counts[msg.timestamp.getDay()]++
  }
  const total = messages.length || 1
  // 월(1)~일(0) 순서로 반환
  const ordered = [1, 2, 3, 4, 5, 6, 0]
  return ordered.map((i) => ({
    day: labels[i],
    count: Math.round((counts[i] / total) * 1000) / 10,
  }))
}

export function buildParticipantData(analyses: ParticipantAnalysis[]): ParticipantChartData[] {
  return analyses
    .map((analysis) => ({
      name: analysis.name,
      count: analysis.message_count,
      percentage: Math.round(analysis.message_percentage * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
}

export function buildParticipantDataFromMessages(messages: ParsedMessage[]): ParticipantChartData[] {
  const counts: Record<string, number> = {}
  for (const m of messages) {
    counts[m.sender] = (counts[m.sender] || 0) + 1
  }
  const total = messages.length
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
}

export function splitWithHighlight(
  text: string,
  keywords: string[],
): Array<{ text: string; highlight: boolean }> {
  if (!keywords || keywords.length === 0) {
    return [{ text, highlight: false }]
  }

  // 정규식 생성 (각 키워드를 OR로 연결)
  const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')

  const parts: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // 강조되지 않은 부분
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), highlight: false })
    }

    // 강조된 부분
    parts.push({ text: match[0], highlight: true })
    lastIndex = match.index + match[0].length
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), highlight: false })
  }

  return parts.length === 0 ? [{ text, highlight: false }] : parts
}

export function getChartColor(index: number): string {
  const colors = [
    '#7c6af7', // primary
    '#4fc3f7', // secondary
    '#4ade80', // success
    '#fbbf24', // warning
    '#fb923c', // orange
    '#f472b6', // pink
    '#a78bfa', // purple
    '#34d399', // teal
  ]
  return colors[index % colors.length]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}
