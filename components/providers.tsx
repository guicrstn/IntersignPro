'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/lib/i18n'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}
