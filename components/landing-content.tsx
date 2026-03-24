'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LandingHeader } from '@/components/landing-header'
import { useTranslation } from '@/lib/i18n'
import { 
  FileSignature, 
  Users, 
  ClipboardList, 
  PenTool, 
  FileText,
  Check,
  ArrowRight,
  Star,
  Zap,
  Crown,
  Smartphone,
  Shield,
  Mail,
  BarChart3,
  Package,
  Receipt,
  Truck,
  FileCheck
} from 'lucide-react'
import { PRODUCTS, TVA_RATE, calculateTTC, formatPrice } from '@/lib/products'
import { cn } from '@/lib/utils'

export function LandingContent() {
  const { t } = useTranslation()

  const features = [
    {
      icon: FileText,
      titleKey: 'landing.features.quotes',
      descKey: 'landing.features.quotesDesc',
    },
    {
      icon: Receipt,
      titleKey: 'landing.features.orders',
      descKey: 'landing.features.ordersDesc',
    },
    {
      icon: Truck,
      titleKey: 'landing.features.delivery',
      descKey: 'landing.features.deliveryDesc',
    },
    {
      icon: FileCheck,
      titleKey: 'landing.features.invoices',
      descKey: 'landing.features.invoicesDesc',
    },
    {
      icon: PenTool,
      titleKey: 'landing.features.signature',
      descKey: 'landing.features.signatureDesc',
    },
    {
      icon: Mail,
      titleKey: 'landing.features.email',
      descKey: 'landing.features.emailDesc',
    },
    {
      icon: Package,
      titleKey: 'landing.features.catalog',
      descKey: 'landing.features.catalogDesc',
    },
    {
      icon: BarChart3,
      titleKey: 'landing.features.dashboard',
      descKey: 'landing.features.dashboardDesc',
    },
    {
      icon: Users,
      titleKey: 'landing.features.clients',
      descKey: 'landing.features.clientsDesc',
    },
    {
      icon: ClipboardList,
      titleKey: 'landing.features.interventions',
      descKey: 'landing.features.interventionsDesc',
    },
    {
      icon: Smartphone,
      titleKey: 'landing.features.mobile',
      descKey: 'landing.features.mobileDesc',
    },
    {
      icon: Shield,
      titleKey: 'landing.features.security',
      descKey: 'landing.features.securityDesc',
    },
  ]

  const testimonials = [
    {
      name: 'Pierre D.',
      company: 'Plomberie Express',
      textKey: 'landing.testimonials.testimonial1',
    },
    {
      name: 'Marie L.',
      company: 'Electricite Plus',
      textKey: 'landing.testimonials.testimonial2',
    },
    {
      name: 'Thomas R.',
      company: 'Services Informatiques',
      textKey: 'landing.testimonials.testimonial3',
    },
  ]

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly': return <Zap className="h-6 w-6" />
      case 'annual': return <Star className="h-6 w-6" />
      case 'lifetime': return <Crown className="h-6 w-6" />
      default: return null
    }
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                {t('landing.hero.trial')}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty">
                {t('landing.hero.subtitle')}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    {t('landing.hero.cta')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="#features">{t('landing.hero.discover')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Document Flow */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{t('landing.flow.quote')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <Receipt className="h-5 w-5 text-amber-500" />
                <span className="font-medium">{t('landing.flow.order')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <Truck className="h-5 w-5 text-cyan-500" />
                <span className="font-medium">{t('landing.flow.delivery')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <FileCheck className="h-5 w-5 text-green-500" />
                <span className="font-medium">{t('landing.flow.invoice')}</span>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              {t('landing.flow.description')}
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              {t('landing.features.subtitle')}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(feature.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl mb-4">
                {t('landing.dashboard.title')}
              </h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
                {t('landing.dashboard.subtitle')}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('landing.dashboard.monthly')}</p>
                      <p className="text-2xl font-bold text-primary">{t('landing.dashboard.realtime')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('landing.dashboard.yearly')}</p>
                      <p className="text-2xl font-bold text-primary">{t('landing.dashboard.realtime')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('landing.dashboard.signedQuotes')}</p>
                      <p className="text-2xl font-bold text-blue-500">{t('landing.dashboard.tracking')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('landing.dashboard.paidInvoices')}</p>
                      <p className="text-2xl font-bold text-green-500">{t('landing.dashboard.tracking')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">{t('landing.dashboard.clientAnalysis')}</p>
                  <p className="text-sm text-muted-foreground">{t('landing.dashboard.clientAnalysisDesc')}</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">{t('landing.dashboard.docTracking')}</p>
                  <p className="text-sm text-muted-foreground">{t('landing.dashboard.docTrackingDesc')}</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">{t('landing.dashboard.history')}</p>
                  <p className="text-sm text-muted-foreground">{t('landing.dashboard.historyDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                {t('landing.pricing.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('landing.pricing.subtitle')} {TVA_RATE}% {t('landing.pricing.applicable')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('landing.pricing.licenseInfo')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRODUCTS.map((product) => {
                const priceTTC = calculateTTC(product.priceHT)
                return (
                  <Card 
                    key={product.id} 
                    className={cn(
                      'relative flex flex-col',
                      product.popular && 'border-primary shadow-lg md:scale-105'
                    )}
                  >
                    {product.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          {t('landing.pricing.recommended')}
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className={cn(
                        'mx-auto mb-4 p-3 rounded-full',
                        product.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {getPlanIcon(product.id)}
                      </div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="text-center mb-4">
                        <span className="text-4xl font-bold text-foreground">
                          {product.priceDisplay}
                        </span>
                        <span className="text-muted-foreground">{product.period}</span>
                      </div>
                      <p className="text-center text-xs text-muted-foreground mb-6">
                        {t('landing.pricing.ttc')} {formatPrice(priceTTC)} TTC{product.mode === 'subscription' ? (product.interval === 'month' ? '/mois' : '/an') : ''}
                      </p>
                      {product.mode === 'subscription' && (
                        <p className="text-center text-sm text-accent font-medium mb-4">
                          {t('landing.pricing.trialIncluded')}
                        </p>
                      )}
                      <ul className="space-y-3">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant={product.popular ? 'default' : 'outline'}
                        className="w-full"
                        asChild
                      >
                        <Link href={`/auth/sign-up?plan=${product.id}`}>
                          {product.mode === 'subscription' ? t('landing.pricing.startTrial') : t('landing.pricing.chooseOffer')}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              {t('landing.pricing.multipleLicenses')}
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                {t('landing.testimonials.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('landing.testimonials.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 italic">&ldquo;{t(testimonial.textKey)}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold md:text-3xl mb-4 text-balance">
              {t('landing.cta.title')}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto text-pretty">
              {t('landing.cta.subtitle')}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">
                {t('landing.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">InterSign Pro</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.footer.pricing')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.footer.legal')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.footer.terms')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.footer.contact')}
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              2026 InterSign Pro - {t('landing.footer.developedBy')} GC Informatik
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
