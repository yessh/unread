import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  removable = false,
  onRemove,
}: BadgeProps) {
  const variantClass = {
    primary: 'bg-accent-primary/20 text-accent-primary',
    secondary: 'bg-accent-secondary/20 text-accent-secondary',
    success: 'bg-accent-success/20 text-accent-success',
    warning: 'bg-accent-warning/20 text-accent-warning',
    danger: 'bg-accent-danger/20 text-accent-danger',
  }[variant]

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size]

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 rounded-full font-medium transition-colors',
        variantClass,
        sizeClass,
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      onClick={onClick}
    >
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-1 hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  )
}
