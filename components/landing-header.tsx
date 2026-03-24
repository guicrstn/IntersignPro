'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language-selector'
import { useTranslation } from '@/lib/i18n/context'
import { FileSignature } from 'lucide-react'

export function LandingHeader() {
  const { t } = useTranslation()

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-primary">
          <FileSignature className="h-7 w-7" />
          <span className="text-xl font-bold">InterSign Pro</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.features')}
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.pricing')}
          </Link>
          <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.testimonials')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <Button asChild variant="ghost">
            <Link href="/auth/login">{t('common.login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">{t('common.freeTrial')}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
