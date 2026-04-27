'use client'

interface Card3Props {
  topWords: { word: string; count: number }[]
}

const RANK_COLORS = [
  'text-yellow-400',
  'text-gray-300',
  'text-amber-600',
  'text-content-secondary',
  'text-content-secondary',
]

export function Card3Words({ topWords }: Card3Props) {
  const max = topWords[0]?.count || 1

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-warning">자주 쓴 단어</p>
      <p className="text-content-secondary">이 대화에서 가장 많이 등장한 단어들</p>
      <div className="flex flex-col gap-3">
        {topWords.map((w, i) => (
          <div key={w.word} className="flex items-center gap-4 rounded-2xl border border-surface-elevated bg-surface-card px-5 py-4">
            <span className={`w-5 text-sm font-bold ${RANK_COLORS[i]}`}>{i + 1}</span>
            <span className="flex-1 text-left text-lg font-semibold text-content-primary">{w.word}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 rounded-full bg-surface-elevated" style={{ width: 60 }}>
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${(w.count / max) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-content-muted">{w.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
