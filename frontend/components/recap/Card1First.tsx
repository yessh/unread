'use client'

interface Card1Props {
  date: Date
  sender: string
  content: string
  roomName: string
}

export function Card1First({ date, sender, content, roomName }: Card1Props) {
  const formatted = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-primary">첫 번째 대화</p>
      <h2 className="text-5xl font-bold text-content-primary">{formatted}</h2>
      <p className="text-content-secondary text-lg">{roomName}의 시작</p>
      <div className="mt-4 rounded-2xl border border-surface-elevated bg-surface-card p-5 text-left">
        <p className="mb-1 text-xs text-content-muted">{sender}</p>
        <p className="text-content-primary leading-relaxed">"{content}"</p>
      </div>
    </div>
  )
}
