'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ArrowLeft, Zap, Star, Crown, AlertCircle, LogOut, Home, Minus, Plus, Users } from 'lucide-react'
import { PRODUCTS, TVA_RATE, calculateTTC, formatPrice } from '@/lib/products'
import { CheckoutButton } from '@/components/checkout-button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

function PricingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const requiresSubscription = searchParams.get('requires_subscription') === 'true'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({
    monthly: 1,
    annual: 1,
    lifetime: 1,
  })

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const updateQuantity = (planId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [planId]: Math.max(1, Math.min(10, (prev[planId] || 1) + delta))
    }))
  }

  const setQuantity = (planId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [planId]: Math.max(1, Math.min(10, value || 1))
    }))
  }

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
          <div className="max-w-2xl mx-auto mb-8 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pour acceder au tableau de bord, veuillez choisir une formule d&apos;abonnement. 
                Profitez de 14 jours d&apos;essai gratuit pour tester toutes les fonctionnalites.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Retourner sur le site
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
              </Button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Choisissez votre formule
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Prix affiches HT - TVA {TVA_RATE}% applicable. Chaque licence = 1 utilisateur.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            14 jours d&apos;essai gratuit pour les abonnements.
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
          {displayedPlans.map((plan) => {
            const quantity = quantities[plan.id] || 1
            const totalHT = plan.priceHT * quantity
            const totalTTC = calculateTTC(totalHT)
            
            return (
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
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.priceDisplay}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                    <span className="text-sm text-muted-foreground block mt-1">
                      par licence
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      Nombre de licences
                    </Label>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(plan.id, -1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        onChange={(e) => setQuantity(plan.id, parseInt(e.target.value))}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(plan.id, 1)}
                        disabled={quantity >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {quantity > 1 && (
                      <div className="mt-3 text-center space-y-1">
                        <p className="text-sm font-medium">
                          Total: {formatPrice(totalHT)} HT
                        </p>
                        <p className="text-xs text-muted-foreground">
                          soit {formatPrice(totalTTC)} TTC
                        </p>
                      </div>
                    )}
                  </div>

                  {plan.mode === 'subscription' && (
                    <p className="text-center text-sm text-accent font-medium mb-4">
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
                    quantity={quantity}
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.mode === 'subscription' 
                      ? 'Commencer l\'essai gratuit' 
                      : 'Souscrire maintenant'}
                  </CheckoutButton>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Enterprise / Sur devis */}
        <Card className="max-w-4xl mx-auto mt-10 bg-gradient-to-r from-muted/50 to-muted border-dashed">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Entreprise (+10 licences)</h3>
                </div>
                <p className="text-muted-foreground max-w-md">
                  Vous avez besoin de plus de 10 utilisateurs ? Contactez-nous pour obtenir un devis personnalise avec des tarifs degressifs.
                </p>
                <ul className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <li className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    Tarifs degressifs
                  </li>
                  <li className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    Support prioritaire
                  </li>
                  <li className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    Formation incluse
                  </li>
                  <li className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary" />
                    Facturation personnalisee
                  </li>
                </ul>
              </div>
              <Button asChild size="lg" variant="outline" className="shrink-0">
                <Link href="mailto:contact@intersign-pro.fr?subject=Demande de devis entreprise (+10 licences)">
                  Demander un devis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
