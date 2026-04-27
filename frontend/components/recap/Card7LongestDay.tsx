'use client'

interface Card7Props {
  date: Date
  count: number
  firstMsg: string
  lastMsg: string
}

export function Card7LongestDay({ date, count, firstMsg, lastMsg }: Card7Props) {
  const formatted = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-warning">가장 길었던 하루</p>

      <div className="rounded-2xl border border-accent-warning/30 bg-surface-card p-6">
        <p className="text-5xl font-bold text-accent-warning">{count.toLocaleString()}</p>
        <p className="mt-1 text-content-secondary">개의 메시지</p>
        <p className="mt-3 text-sm text-content-muted">{formatted}</p>
      </div>

      <div className="flex flex-col gap-3 text-left">
        <div className="rounded-xl border border-surface-elevated bg-surface-card px-4 py-3">
          <p className="mb-1 text-xs text-content-muted">그날의 시작</p>
          <p className="text-sm text-content-primary">"{firstMsg}{firstMsg.length >= 40 ? '...' : ''}"</p>
        </div>
        <div className="rounded-xl border border-surface-elevated bg-surface-card px-4 py-3">
          <p className="mb-1 text-xs text-content-muted">그날의 마지막</p>
          <p className="text-sm text-content-primary">"{lastMsg}{lastMsg.length >= 40 ? '...' : ''}"</p>
        </div>
      </div>
    </div>
  )
}
