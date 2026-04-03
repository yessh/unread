import { splitWithHighlight } from '@/lib/chartUtils'

interface HighlightedMessageProps {
  sender: string
  content: string
  relevance: string
  keywords: string[]
}

export function HighlightedMessage({
  sender,
  content,
  relevance,
  keywords,
}: HighlightedMessageProps) {
  const parts = splitWithHighlight(content, keywords)

  return (
    <div className="space-y-2 rounded-lg border border-surface-elevated bg-surface-card/50 p-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-accent-primary">{sender}</span>
        <span className="text-xs text-content-muted">{relevance}</span>
      </div>

      <p className="text-content-primary">
        {parts.map((part, idx) =>
          part.highlight ? (
            <span key={idx} className="rounded bg-accent-primary/20 px-1 font-semibold text-accent-primary">
              {part.text}
            </span>
          ) : (
            <span key={idx}>{part.text}</span>
          ),
        )}
      </p>
    </div>
  )
}
