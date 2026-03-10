'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Check, ArrowLeft, CreditCard } from 'lucide-react'
import { PRODUCTS, type PlanId } from '@/lib/products'
import { createCheckoutSession } from '@/app/actions/stripe'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('plan') as PlanId | null
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const plan = planId ? PRODUCTS.find(p => p.id === planId) : null

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      
      // Si pas connecte, rediriger vers inscription avec le plan en parametre
      if (!user) {
        router.push(`/auth/sign-up?plan=${planId}`)
      }
    }
    checkAuth()
  }, [planId, router])

  const handleCheckout = async () => {
    if (!planId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Passer l'URL de base actuelle pour la redirection Stripe
      const baseUrl = window.location.origin
      const { url } = await createCheckoutSession(planId, baseUrl)
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plan non trouve</CardTitle>
            <CardDescription>Le plan demande n&apos;existe pas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/pricing">Voir les tarifs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour aux tarifs
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Finaliser votre abonnement
            </h1>
            <p className="text-muted-foreground">
              Vous avez choisi le plan {plan.name}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prix */}
              <div className="text-center py-4 border-b">
                <span className="text-4xl font-bold text-foreground">
                  {plan.priceDisplay}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
                {plan.mode === 'subscription' && (
                  <p className="text-sm text-accent font-medium mt-2">
                    14 jours d&apos;essai gratuit
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* CTA */}
              <Button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Redirection vers Stripe...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {plan.mode === 'subscription' 
                      ? 'Commencer l\'essai gratuit' 
                      : 'Payer maintenant'}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Paiement securise par Stripe. {plan.mode === 'subscription' && 'Annulation possible a tout moment.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
