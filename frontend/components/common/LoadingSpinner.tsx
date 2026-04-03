interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }[size]

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClass} animate-spin rounded-full border-surface-elevated border-t-accent-primary`}
      />
      {message && <p className="text-sm text-content-secondary">{message}</p>}
    </div>
  )
}
