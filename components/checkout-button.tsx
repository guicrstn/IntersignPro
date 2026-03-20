'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/stripe'
import type { PlanId } from '@/lib/products'
import { Spinner } from '@/components/ui/spinner'

interface CheckoutButtonProps {
  planId: PlanId
  quantity?: number
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function CheckoutButton({ planId, quantity = 1, children, variant = 'default', className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      // Passer l'URL de base actuelle pour la redirection Stripe
      const baseUrl = window.location.origin
      const { url } = await createCheckoutSession(planId, quantity, baseUrl)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur lors du checkout:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement'
      
      // Si l'utilisateur n'est pas connecte, rediriger vers la page de connexion
      if (errorMessage.includes('connecte')) {
        router.push(`/auth/login?redirect=/pricing&plan=${planId}`)
        return
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
      {children}
    </Button>
  )
}
