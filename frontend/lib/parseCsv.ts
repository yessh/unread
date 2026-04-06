import Papa from 'papaparse'
import type { ParsedMessage } from './types'

interface CsvRow {
  [key: string]: string
}

function parseDateTime(dateStr: string, timeStr?: string): Date | null {
  // 날짜+시간 합친 형식: "2026-03-12 14:19:53" 또는 "2026-03-12T14:19:53"
  const combinedMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (combinedMatch) {
    return new Date(
      parseInt(combinedMatch[1], 10),
      parseInt(combinedMatch[2], 10) - 1,
      parseInt(combinedMatch[3], 10),
      parseInt(combinedMatch[4], 10),
      parseInt(combinedMatch[5], 10),
      parseInt(combinedMatch[6] ?? '0', 10),
    )
  }

  // 날짜만 있고 시간은 별도 컬럼
  const dateOnly =
    dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) ||
    dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (dateOnly && timeStr) {
    const isAfternoon = timeStr.includes('오후')
    const isMorning = timeStr.includes('오전')
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (!timeMatch) return null

    let hour = parseInt(timeMatch[1], 10)
    const minute = parseInt(timeMatch[2], 10)

    if (isAfternoon && hour !== 12) hour += 12
    if (isMorning && hour === 12) hour = 0

    return new Date(
      parseInt(dateOnly[1], 10),
      parseInt(dateOnly[2], 10) - 1,
      parseInt(dateOnly[3], 10),
      hour,
      minute,
      0,
    )
  }

  return null
}

function detectColumns(headers: string[]): {
  dateIdx: number
  timeIdx: number | null
  senderIdx: number
  contentIdx: number
} {
  const lower = headers.map((h) => h.toLowerCase().trim())

  const dateIdx = lower.findIndex((h) => h.includes('날짜') || h === 'date')
  const timeIdx = lower.findIndex((h) => h.includes('시간') || h === 'time')
  const senderIdx = lower.findIndex(
    (h) => h.includes('보낸') || h.includes('sender') || h === 'user' || h.includes('사람'),
  )
  const contentIdx = lower.findIndex(
    (h) => h.includes('내용') || h.includes('message') || h.includes('text'),
  )

  return {
    dateIdx: dateIdx !== -1 ? dateIdx : 0,
    timeIdx: timeIdx !== -1 ? timeIdx : null,
    senderIdx: senderIdx !== -1 ? senderIdx : 2,
    contentIdx: contentIdx !== -1 ? contentIdx : 3,
  }
}

function convertRowsToMessages(rows: CsvRow[]): ParsedMessage[] {
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0])
  const { dateIdx, timeIdx, senderIdx, contentIdx } = detectColumns(headers)

  const messages: ParsedMessage[] = []

  for (const row of rows) {
    const rowArray = Object.values(row)
    const maxIdx = Math.max(dateIdx, senderIdx, contentIdx, timeIdx ?? 0)
    if (rowArray.length <= maxIdx) continue

    try {
      const dateStr = rowArray[dateIdx]?.trim()
      const timeStr = timeIdx !== null ? rowArray[timeIdx]?.trim() : undefined
      const sender = rowArray[senderIdx]?.trim()
      const content = rowArray[contentIdx]?.trim()

      if (!dateStr || !sender || !content) continue

      const timestamp = parseDateTime(dateStr, timeStr)
      if (!timestamp) continue

      messages.push({ sender, content, timestamp })
    } catch {
      continue
    }
  }

  return messages
}

async function parseWithEncoding(file: File, encoding: string): Promise<ParsedMessage[]> {
  const buffer = await file.arrayBuffer()
  const decoder = new TextDecoder(encoding)
  const text = decoder.decode(buffer)

  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          resolve(convertRowsToMessages(results.data as CsvRow[]))
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`CSV 파싱 실패: ${error.message}`))
      },
    })
  })
}

export async function parseCsv(file: File): Promise<ParsedMessage[]> {
  const messages = await parseWithEncoding(file, 'utf-8')

  if (messages.length === 0) {
    try {
      const fallback = await parseWithEncoding(file, 'euc-kr')
      if (fallback.length > 0) return fallback
    } catch {
      // EUC-KR 실패 시 UTF-8 결과 반환
    }
  }

  return messages
}
