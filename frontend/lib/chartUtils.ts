import type { HourlyChartData, ParticipantAnalysis, ParticipantChartData, ParsedMessage } from './types'

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

  // 차트 데이터 변환
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}시`,
    count: hourCounts[i],
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
