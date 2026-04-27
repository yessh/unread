'use client'

interface Card6Props {
  topHours: { hour: number; count: number }[]
  isLateNight: boolean
}

function hourLabel(h: number) {
  if (h === 0) return '자정'
  if (h < 5) return `새벽 ${h}시`
  if (h < 12) return `오전 ${h}시`
  if (h === 12) return '정오'
  if (h < 18) return `오후 ${h - 12}시`
  return `밤 ${h - 12}시`
}

const RANK_COLORS = [
  'text-yellow-400',
  'text-gray-300',
  'text-amber-600',
  'text-content-secondary',
  'text-content-secondary',
]

export function Card6NightOwl({ topHours, isLateNight }: Card6Props) {
  const max = topHours[0]?.count || 1

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-secondary">
        {isLateNight ? '새벽 대화' : '대화 피크 타임'}
      </p>
      <p className="text-content-secondary text-sm">
        {isLateNight ? '너희는 늦은 밤에 가장 솔직했어요.' : '이 시간만 되면 카톡이 울렸겠네요.'}
      </p>

      <div className="flex flex-col gap-3">
        {topHours.map((h, i) => (
          <div key={h.hour} className="flex items-center gap-4 rounded-2xl border border-surface-elevated bg-surface-card px-5 py-4">
            <span className={`w-5 text-sm font-bold ${RANK_COLORS[i]}`}>{i + 1}</span>
            <span className="flex-1 text-left font-semibold text-content-primary">{hourLabel(h.hour)}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 rounded-full bg-surface-elevated" style={{ width: 60 }}>
                <div
                  className="h-full rounded-full bg-accent-secondary"
                  style={{ width: `${(h.count / max) * 100}%` }}
                />
              </div>
              <span className="w-14 text-right text-sm text-content-muted">{h.count.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
