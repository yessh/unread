import { Badge } from '@/components/common/Badge'
import { getChartColor, getInitials } from '@/lib/chartUtils'
import type { ParticipantAnalysis } from '@/lib/types'

interface ParticipantCardProps {
  participant: ParticipantAnalysis
  colorIndex: number
}

export function ParticipantCard({ participant, colorIndex }: ParticipantCardProps) {
  const bgColor = getChartColor(colorIndex)
  const initials = getInitials(participant.name)

  // 이모지 빈도를 표현
  const emojiBar = Math.ceil(participant.emoji_usage_frequency / 5)

  return (
    <div className="card-hover group">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex-center h-12 w-12 rounded-full font-bold text-white"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-content-primary">{participant.name}</h3>
          <p className="text-sm text-content-secondary">
            {participant.message_count}개 메시지 ({participant.message_percentage.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="border-t border-surface-elevated pt-4">
        {/* 성격 요약 */}
        <div className="mb-4">
          <p className="text-sm text-content-primary line-clamp-3">
            {participant.personality_summary}
          </p>
        </div>

        {/* 말투 태그들 */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" size="sm">
            {participant.linguistic_features.sentence_length}
          </Badge>
          <Badge variant="secondary" size="sm">
            {participant.linguistic_features.formality}
          </Badge>
          <Badge variant="secondary" size="sm">
            {participant.response_tone}
          </Badge>
        </div>

        {/* 이모지 사용 빈도 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">이모지 사용</span>
            <span className="text-xs text-accent-primary">{participant.emoji_usage_frequency}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < emojiBar ? 'bg-accent-warning' : 'bg-surface-elevated'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 주요 특징 */}
        {participant.key_characteristics.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-content-secondary">주요 특징</p>
            <div className="flex flex-wrap gap-1">
              {participant.key_characteristics.slice(0, 3).map((char, idx) => (
                <Badge key={idx} variant="primary" size="sm">
                  {char}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 신뢰도 바 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">분석 신뢰도</span>
            <span className="text-xs text-accent-primary font-semibold">
              {Math.round(participant.confidence_score * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-700"
              style={{ width: `${participant.confidence_score * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
