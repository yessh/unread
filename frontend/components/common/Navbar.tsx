import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-surface-elevated bg-surface-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/upload" className="flex items-center gap-2">
            <div className="flex-center h-8 w-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
              <span className="text-sm font-bold text-white">U</span>
            </div>
            <span className="text-lg font-bold text-content-primary">unread</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="rounded-lg px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-elevated"
            >
              새 파일 분석
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
