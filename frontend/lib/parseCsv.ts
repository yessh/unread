import Papa from 'papaparse'
import type { ParsedMessage } from './types'

interface CsvRow {
  [key: string]: string
}

export async function parseCsv(file: File): Promise<ParsedMessage[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const messages = convertCsvToMessages(results.data as CsvRow[])
          resolve(messages)
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

function convertCsvToMessages(rows: CsvRow[]): ParsedMessage[] {
  const messages: ParsedMessage[] = []

  // CSV 컬럼명 감지 (대소문자 무시)
  if (rows.length === 0) {
    return messages
  }

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase())

  // 컬럼 인덱스 찾기
  const dateColIdx = headers.findIndex((h) => h.includes('날짜') || h.includes('date'))
  const timeColIdx = headers.findIndex((h) => h.includes('시간') || h.includes('time'))
  const senderColIdx = headers.findIndex((h) => h.includes('보낸') || h.includes('sender'))
  const contentColIdx = headers.findIndex((h) => h.includes('내용') || h.includes('message') || h.includes('text'))

  // 실패 시 기본 컬럼 순서 가정 (날짜, 시간, 보낸사람, 내용)
  const dateIdx = dateColIdx !== -1 ? dateColIdx : 0
  const timeIdx = timeColIdx !== -1 ? timeColIdx : 1
  const senderIdx = senderColIdx !== -1 ? senderColIdx : 2
  const contentIdx = contentColIdx !== -1 ? contentColIdx : 3

  for (const row of rows) {
    const rowArray = Object.values(row)

    if (rowArray.length <= contentIdx) {
      continue
    }

    try {
      const dateStr = rowArray[dateIdx]?.trim()
      const timeStr = rowArray[timeIdx]?.trim()
      const sender = rowArray[senderIdx]?.trim()
      const content = rowArray[contentIdx]?.trim()

      if (!dateStr || !timeStr || !sender || !content) {
        continue
      }

      // 날짜 파싱 (YYYY-MM-DD 또는 YYYY/MM/DD)
      const dateRegex = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
      const dateMatch = dateStr.match(dateRegex)

      // 시간 파싱 (HH:MM 또는 HH:MM:SS)
      const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?/
      const timeMatch = timeStr.match(timeRegex)

      if (!dateMatch || !timeMatch) {
        continue
      }

      const year = parseInt(dateMatch[1], 10)
      const month = parseInt(dateMatch[2], 10)
      const day = parseInt(dateMatch[3], 10)
      const hour = parseInt(timeMatch[1], 10)
      const minute = parseInt(timeMatch[2], 10)

      const timestamp = new Date(year, month - 1, day, hour, minute, 0)

      messages.push({
        sender,
        content,
        timestamp,
      })
    } catch {
      // 해당 행 파싱 실패 시 건너뛰기
      continue
    }
  }

  return messages
}
