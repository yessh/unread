import JSZip from 'jszip'
import type { ParsedMessage } from './types'

const DATE_HEADER_PATTERN = /(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/
const MESSAGE_PATTERN = /^(\d{4})\. (\d{1,2})\. (\d{1,2})\. (오전|오후)\s+(\d{1,2}):(\d{2}),\s+(.+?)\s*:\s+(.+)$/

export async function parseKakaoTxt(file: File): Promise<ParsedMessage[]> {
  try {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)

    // 모든 .txt 파일 찾기
    const txtEntries = Object.entries(zipContent.files).filter(
      ([filename, fileObj]) => filename.endsWith('.txt') && !fileObj.dir
    )

    if (txtEntries.length === 0) {
      throw new Error('ZIP 파일에서 .txt 파일을 찾을 수 없습니다')
    }

    const allMessages: ParsedMessage[] = []
    for (const [, fileObj] of txtEntries) {
      const txtContent = await fileObj.async('text')
      allMessages.push(...parseTextContent(txtContent))
    }

    // 시간순 정렬 (여러 파일 병합 시 순서 보장)
    allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return allMessages
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`카카오톡 파일 파싱 실패: ${error.message}`)
    }
    throw error
  }
}

function parseTextContent(content: string): ParsedMessage[] {
  const messages: ParsedMessage[] = []
  const lines = content.split('\n')

  let currentYear = 0
  let currentMonth = 0
  let currentDay = 0

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) continue

    // 날짜 헤더 파싱
    const dateMatch = trimmedLine.match(DATE_HEADER_PATTERN)
    if (dateMatch) {
      currentYear = parseInt(dateMatch[1], 10)
      currentMonth = parseInt(dateMatch[2], 10)
      currentDay = parseInt(dateMatch[3], 10)
      continue
    }

    // 메시지 파싱
    const msgMatch = trimmedLine.match(MESSAGE_PATTERN)
    if (msgMatch) {
      const year = parseInt(msgMatch[1], 10)
      const month = parseInt(msgMatch[2], 10)
      const day = parseInt(msgMatch[3], 10)
      const period = msgMatch[4] // 오전/오후
      let hour = parseInt(msgMatch[5], 10)
      const minute = parseInt(msgMatch[6], 10)
      const sender = msgMatch[7]
      const content = msgMatch[8]

      // 오전/오후를 24시간 형식으로 변환
      if (period === '오후' && hour !== 12) {
        hour += 12
      } else if (period === '오전' && hour === 12) {
        hour = 0
      }

      const timestamp = new Date(year, month - 1, day, hour, minute, 0)

      messages.push({
        sender: sender.trim(),
        content: content.trim(),
        timestamp,
      })
    }
  }

  return messages
}
