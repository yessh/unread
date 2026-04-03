import type { Metadata } from 'next'
import { Navbar } from '@/components/common/Navbar'
import { AnalysisProvider } from '@/context/AnalysisContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'unread - 카카오톡 대화 분석',
  description: 'AI가 당신의 카카오톡 대화를 분석하고 인사이트를 제공합니다',
  icons: {
    icon: '🔍',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-surface-base text-content-primary">
        <AnalysisProvider>
          <Navbar />
          {children}
        </AnalysisProvider>
      </body>
    </html>
  )
}
