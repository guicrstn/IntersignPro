'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Check,
  ArrowRight,
  Crown,
  Clock,
  X
} from 'lucide-react'
import { 
  getSubscriptionStatus, 
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  createCheckoutSession
} from '@/app/actions/stripe'
import { PRODUCTS, type PlanId } from '@/lib/products'
import { cn } from '@/lib/utils'

interface SubscriptionData {
  subscription_status: string | null
  subscription_plan: string | null
  subscription_end_date: string | null
  trial_used: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function fetchSubscription() {
      const data = await getSubscriptionStatus()
      setSubscription(data)
      setIsLoading(false)
    }
    fetchSubscription()
  }, [])

  const currentPlan = subscription?.subscription_plan 
    ? PRODUCTS.find(p => p.id === subscription.subscription_plan)
    : null

  const handleManageBilling = async () => {
    setActionLoading('billing')
    try {
      const baseUrl = window.location.origin
      const { url } = await createBillingPortalSession(baseUrl)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      setModalMessage('Impossible d\'acceder au portail de facturation. Veuillez reessayer plus tard.')
      setShowErrorModal(true)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    setShowCancelModal(false)
    setActionLoading('cancel')
    try {
      // Verifier si on peut annuler
      if (!subscription?.stripe_subscription_id) {
        setModalMessage('Votre abonnement est en periode d\'essai. Vous pouvez simplement arreter d\'utiliser le service, il sera automatiquement desactive a la fin de la periode d\'essai.')
        setShowErrorModal(true)
        return
      }
      
      await cancelSubscription()
      const data = await getSubscriptionStatus()
      setSubscription(data)
      setSuccessMessage('Votre abonnement a ete annule. Vous conservez l\'acces jusqu\'a la fin de la periode en cours.')
      setShowSuccessModal(true)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Aucun abonnement actif')) {
        setModalMessage('Votre essai gratuit sera automatiquement desactive a la fin de la periode. Aucune action necessaire.')
      } else {
        setModalMessage('Une erreur est survenue lors de l\'annulation. Veuillez reessayer.')
      }
      setShowErrorModal(true)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async () => {
    setActionLoading('reactivate')
    try {
      await reactivateSubscription()
      const data = await getSubscriptionStatus()
      setSubscription(data)
      setSuccessMessage('Votre abonnement a ete reactive avec succes.')
      setShowSuccessModal(true)
    } catch (error) {
      setModalMessage('Impossible de reactiver l\'abonnement. Veuillez nous contacter.')
      setShowErrorModal(true)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpgrade = async (planId: PlanId) => {
    setActionLoading(planId)
    try {
      const baseUrl = window.location.origin
      const { url } = await createCheckoutSession(planId, baseUrl)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      setModalMessage('Erreur lors du changement de plan. Veuillez reessayer.')
      setShowErrorModal(true)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Actif</Badge>
      case 'trial':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Essai gratuit</Badge>
      case 'canceled':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Annule</Badge>
      case 'past_due':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Paiement en retard</Badge>
      default:
        return <Badge variant="outline">Aucun abonnement</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const hasActiveSubscription = subscription?.subscription_status === 'active' || 
                                 subscription?.subscription_status === 'trial' ||
                                 subscription?.subscription_status === 'canceled'

  const canCancel = hasActiveSubscription && 
                    subscription?.subscription_plan !== 'lifetime' &&
                    subscription?.subscription_status !== 'canceled'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon abonnement</h1>
        <p className="text-muted-foreground">Gerez votre abonnement et vos informations de paiement</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Plan actuel</CardTitle>
                <CardDescription>
                  {currentPlan ? currentPlan.name : 'Aucun plan actif'}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(subscription?.subscription_status ?? null)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{currentPlan.priceDisplay}</span>
              <span className="text-muted-foreground">{currentPlan.period}</span>
            </div>
          )}

          {subscription?.subscription_status === 'trial' && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-600">
                Votre essai gratuit se termine le {formatDate(subscription.subscription_end_date)}
              </p>
            </div>
          )}

          {subscription?.subscription_status === 'canceled' && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-600">
                Votre abonnement a ete annule. Acces jusqu&apos;au {formatDate(subscription.subscription_end_date)}
              </p>
            </div>
          )}

          {subscription?.subscription_end_date && subscription.subscription_status === 'active' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Prochain renouvellement : {formatDate(subscription.subscription_end_date)}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          {hasActiveSubscription && subscription?.stripe_customer_id && (
            <Button 
              variant="outline" 
              onClick={handleManageBilling}
              disabled={actionLoading === 'billing'}
            >
              {actionLoading === 'billing' ? <Spinner className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Gerer la facturation
            </Button>
          )}

          {subscription?.subscription_status === 'canceled' ? (
            <Button 
              onClick={handleReactivate}
              disabled={actionLoading === 'reactivate'}
            >
              {actionLoading === 'reactivate' ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
              Reactiver l&apos;abonnement
            </Button>
          ) : canCancel && (
            <Button 
              variant="destructive" 
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' && <Spinner className="mr-2 h-4 w-4" />}
              Annuler l&apos;abonnement
            </Button>
          )}

          {!hasActiveSubscription && (
            <Button onClick={() => router.push('/pricing')}>
              Choisir un plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Upgrade Options */}
      {hasActiveSubscription && subscription?.subscription_plan !== 'lifetime' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Changer de plan</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PRODUCTS.map((product) => {
              const isCurrent = product.id === subscription?.subscription_plan
              const isUpgrade = product.priceInCents > (currentPlan?.priceInCents || 0)
              
              return (
                <Card 
                  key={product.id}
                  className={cn(
                    'relative',
                    isCurrent && 'border-primary bg-primary/5',
                    product.popular && !isCurrent && 'border-accent'
                  )}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Plan actuel</Badge>
                    </div>
                  )}
                  {product.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="secondary">Recommande</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">{product.priceDisplay}</span>
                      <span className="text-muted-foreground text-sm">{product.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    {product.savings && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {product.savings}
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : (isUpgrade ? 'default' : 'secondary')}
                      disabled={isCurrent || actionLoading === product.id}
                      onClick={() => handleUpgrade(product.id as PlanId)}
                    >
                      {actionLoading === product.id && <Spinner className="mr-2 h-4 w-4" />}
                      {isCurrent ? 'Plan actuel' : (isUpgrade ? 'Mettre a niveau' : 'Changer')}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Features */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fonctionnalites incluses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Annuler l&apos;abonnement
            </DialogTitle>
            <DialogDescription className="pt-2">
              Etes-vous sur de vouloir annuler votre abonnement ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">En annulant, vous :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Conserverez l&apos;acces jusqu&apos;a la fin de la periode en cours</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-destructive mt-0.5" />
                  <span>Perdrez l&apos;acces a toutes les fonctionnalites apres cette date</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Pourrez reactiver a tout moment</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Garder mon abonnement
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Information
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{modalMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Succes
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
