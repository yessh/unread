'use client'

interface Card9Props {
  busiest: { month: string; count: number }
  quietest: { month: string; count: number }
}

export function Card9MonthRange({ busiest, quietest }: Card9Props) {
  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-primary">온도 차이</p>
      <p className="text-content-secondary text-sm">가장 뜨거웠던 달과 조용했던 달</p>

      <div className="rounded-2xl border border-accent-primary/30 bg-surface-card p-6">
        <p className="text-xs text-content-muted mb-2">가장 활발했던 달</p>
        <p className="text-3xl font-bold text-accent-primary">{busiest.month}</p>
        <p className="mt-1 text-content-secondary">{busiest.count.toLocaleString()}개의 메시지</p>
        <p className="mt-2 text-xs text-content-muted">이때 무슨 일이 있었을까요?</p>
      </div>

      <div className="flex items-center gap-3 text-content-muted text-sm">
        <div className="flex-1 h-px bg-surface-elevated" />
        <span>그리고</span>
        <div className="flex-1 h-px bg-surface-elevated" />
      </div>

      <div className="rounded-2xl border border-surface-elevated bg-surface-card p-6">
        <p className="text-xs text-content-muted mb-2">가장 조용했던 달</p>
        <p className="text-3xl font-bold text-content-secondary">{quietest.month}</p>
        <p className="mt-1 text-content-muted">{quietest.count.toLocaleString()}개의 메시지</p>
        <p className="mt-2 text-xs text-content-muted">이 달엔 각자의 시간이 더 많았겠네요.</p>
      </div>
    </div>
  )
}
