'use client'

interface Card2Props {
  messageCount: number
  dayCount: number
  senderCount: number
}

export function Card2Total({ messageCount, dayCount, senderCount }: Card2Props) {
  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent-secondary">우리의 기록</p>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-surface-elevated bg-surface-card p-6">
          <p className="text-6xl font-bold text-content-primary">{messageCount.toLocaleString()}</p>
          <p className="mt-2 text-content-secondary">개의 메시지</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-surface-elevated bg-surface-card p-5">
            <p className="text-4xl font-bold text-accent-primary">{dayCount.toLocaleString()}</p>
            <p className="mt-1 text-sm text-content-secondary">일 동안</p>
          </div>
          <div className="rounded-2xl border border-surface-elevated bg-surface-card p-5">
            <p className="text-4xl font-bold text-accent-secondary">{senderCount}</p>
            <p className="mt-1 text-sm text-content-secondary">명이서</p>
          </div>
        </div>
      </div>
    </div>
  )
}
