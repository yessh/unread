interface InsightBannerProps {
  insights: string
}

export function InsightBanner({ insights }: InsightBannerProps) {
  return (
    <div className="card border-l-4 border-accent-primary bg-gradient-to-r from-accent-primary/10 to-transparent">
      <div className="flex gap-4">
        <div className="flex-shrink-0 text-3xl">💡</div>
        <div>
          <h3 className="mb-2 font-semibold text-accent-primary">분석 통찰</h3>
          <p className="whitespace-pre-wrap text-sm text-content-secondary">{insights}</p>
        </div>
      </div>
    </div>
  )
}
