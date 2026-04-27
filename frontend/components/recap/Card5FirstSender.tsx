'use client'

interface Card5Props {
  firstSender: { sender: string; count: number; percentage: number }[]
}

export function Card5FirstSender({ firstSender }: Card5Props) {
  const top = firstSender[0]

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-danger">먼저 연락한 사람</p>
      <p className="text-content-secondary">매일 먼저 카톡을 보낸 사람은?</p>

      {top && (
        <div className="rounded-2xl border border-accent-primary/30 bg-surface-card p-6">
          <p className="text-5xl font-bold text-accent-primary">{top.percentage}%</p>
          <p className="mt-2 text-xl font-semibold text-content-primary">{top.sender}</p>
          <p className="mt-1 text-content-secondary">총 {top.count}일 먼저 연락</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {firstSender.map((s) => (
          <div key={s.sender} className="flex items-center gap-3 rounded-2xl border border-surface-elevated bg-surface-card px-5 py-3">
            <span className="flex-1 text-left font-semibold text-content-primary">{s.sender}</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-content-muted">{s.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
