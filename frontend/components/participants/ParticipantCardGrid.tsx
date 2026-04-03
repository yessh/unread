import { ParticipantCard } from './ParticipantCard'
import type { ParticipantAnalysis } from '@/lib/types'

interface ParticipantCardGridProps {
  participants: ParticipantAnalysis[]
}

export function ParticipantCardGrid({ participants }: ParticipantCardGridProps) {
  if (participants.length === 0) {
    return (
      <div className="card flex-center flex-col gap-4 text-center">
        <div className="text-4xl">👥</div>
        <p className="text-content-secondary">참여자 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {participants.map((participant, idx) => (
        <ParticipantCard key={participant.name} participant={participant} colorIndex={idx} />
      ))}
    </div>
  )
}
