'use client'

interface RecapCardProps {
  children: React.ReactNode
  index: number
  total: number
}

export function RecapCard({ children, index, total }: RecapCardProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-16 animate-fade-in">
      <div className="w-full max-w-sm">
        {children}
      </div>
      <div className="absolute bottom-8 flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`block h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-accent-primary' : 'w-1.5 bg-content-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
