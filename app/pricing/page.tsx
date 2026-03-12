'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, ArrowLeft, Zap, Star, Crown, AlertCircle } from 'lucide-react'
import { PRODUCTS } from '@/lib/products'
import { CheckoutButton } from '@/components/checkout-button'
import { cn } from '@/lib/utils'

function PricingContent() {
  const searchParams = useSearchParams()
  const requiresSubscription = searchParams.get('requires_subscription') === 'true'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

  const displayedPlans = PRODUCTS.filter(plan => {
    if (plan.id === 'lifetime') return true
    if (billingCycle === 'monthly') return plan.id === 'monthly'
    return plan.id === 'annual'
  })

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly':
        return <Zap className="h-6 w-6" />
      case 'annual':
        return <Star className="h-6 w-6" />
      case 'lifetime':
        return <Crown className="h-6 w-6" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour a l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Alert if subscription required */}
        {requiresSubscription && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Pour acceder au tableau de bord, veuillez choisir une formule d&apos;abonnement. 
              Profitez de 14 jours d&apos;essai gratuit pour tester toutes les fonctionnalites.
            </AlertDescription>
          </Alert>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Choisissez votre formule
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Commencez avec 14 jours d&apos;essai gratuit. Sans engagement, annulez a tout moment.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingCycle === 'monthly' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingCycle === 'annual' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Annuel
              <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {displayedPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-lg'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Le plus populaire
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className={cn(
                  'mx-auto mb-4 p-3 rounded-full',
                  plan.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.priceDisplay}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                {plan.mode === 'subscription' && (
                  <p className="text-center text-sm text-accent font-medium mb-6">
                    14 jours d&apos;essai gratuit
                  </p>
                )}

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <CheckoutButton 
                  planId={plan.id as 'monthly' | 'annual' | 'lifetime'}
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  {plan.mode === 'subscription' 
                    ? 'Commencer l\'essai gratuit' 
                    : 'Souscrire maintenant'}
                </CheckoutButton>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Trust */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Paiement securise par Stripe. Annulation possible a tout moment.
          </p>
<p className="text-muted-foreground text-sm mt-2">
          Besoin d&apos;aide ? <Link href="mailto:contact@intersign-pro.fr" className="text-primary hover:underline">Contactez-nous</Link>
        </p>
      </div>
    </main>
  </div>
)
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <PricingContent />
    </Suspense>
  )
}
