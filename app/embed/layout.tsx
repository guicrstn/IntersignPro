import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'InterSign Pro - Mode Embed',
  description: 'Application de bons d\'intervention integree',
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
