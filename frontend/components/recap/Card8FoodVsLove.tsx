'use client'

interface Card8Props {
  foodCount: number
  loveCount: number
  winner: 'food' | 'love' | 'tie'
}

export function Card8FoodVsLove({ foodCount, loveCount, winner }: Card8Props) {
  const total = foodCount + loveCount || 1
  const foodPct = Math.round((foodCount / total) * 100)
  const lovePct = 100 - foodPct

  const verdict = {
    food: '밥 생각이 사랑보다 앞섰던 사이',
    love: '마음이 먼저였던 사이',
    tie: '먹는 것도, 감정도 똑같이 중요했던 사이',
  }[winner]

  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-danger">밥 vs 사랑</p>
      <p className="text-content-secondary text-sm">이 대화에서 더 많이 나온 건?</p>

      <div className="flex gap-4">
        <div className={`flex-1 rounded-2xl border p-5 ${winner === 'food' ? 'border-accent-warning bg-accent-warning/10' : 'border-surface-elevated bg-surface-card'}`}>
          <p className="text-3xl mb-2">🍚</p>
          <p className="text-3xl font-bold text-content-primary">{foodCount}</p>
          <p className="mt-1 text-xs text-content-muted">밥/음식 언급</p>
        </div>
        <div className="flex items-center text-content-muted font-bold">VS</div>
        <div className={`flex-1 rounded-2xl border p-5 ${winner === 'love' ? 'border-accent-danger bg-accent-danger/10' : 'border-surface-elevated bg-surface-card'}`}>
          <p className="text-3xl mb-2">💕</p>
          <p className="text-3xl font-bold text-content-primary">{loveCount}</p>
          <p className="mt-1 text-xs text-content-muted">보고싶어/사랑해</p>
        </div>
      </div>

      {/* 비율 바 */}
      <div className="h-3 rounded-full overflow-hidden flex">
        <div className="bg-accent-warning transition-all" style={{ width: `${foodPct}%` }} />
        <div className="bg-accent-danger transition-all" style={{ width: `${lovePct}%` }} />
      </div>

      <p className="text-content-secondary font-medium">{verdict}</p>
    </div>
  )
}
