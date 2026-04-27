'use client'

interface Card4Props {
  monthlyKing: { month: string; sender: string; count: number }[]
}

export function Card4MonthlyKing({ monthlyKing }: Card4Props) {
  const recent = monthlyKing.slice(-6)

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-success">월별 메시지 왕</p>
      <p className="text-content-secondary">누가 더 많이 보냈을까요?</p>
      <div className="flex flex-col gap-2">
        {recent.map((m) => (
          <div key={m.month} className="flex items-center gap-4 rounded-2xl border border-surface-elevated bg-surface-card px-5 py-3">
            <span className="w-16 text-left text-sm text-content-muted">{m.month}</span>
            <span className="flex-1 text-left font-semibold text-content-primary">{m.sender}</span>
            <span className="text-sm text-accent-success">{m.count.toLocaleString()}개</span>
          </div>
        ))}
      </div>
      {monthlyKing.length > 6 && (
        <p className="text-xs text-content-muted">최근 6개월 기준</p>
      )}
    </div>
  )
}
