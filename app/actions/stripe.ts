'use server'

import { stripe } from '@/lib/stripe'
import { PRODUCTS, type PlanId, TVA_RATE, calculateTTC } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

// Helper pour obtenir l'URL de base de l'application
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

export async function createCheckoutSession(planId: PlanId, quantity: number = 1, baseUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vous devez etre connecte pour souscrire a un abonnement')
  }

  const plan = PRODUCTS.find(p => p.id === planId)
  if (!plan) {
    throw new Error('Plan invalide')
  }

  // Valider la quantite
  if (quantity < 1 || quantity > 100) {
    throw new Error('Nombre de licences invalide (1-100)')
  }
  
  // Utiliser l'URL fournie par le client ou celle du serveur
  const appUrl = baseUrl || getBaseUrl()

  // Verifier si l'utilisateur a deja utilise son essai gratuit
  const { data: company } = await supabase
    .from('companies')
    .select('trial_used, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  // Creer ou recuperer le customer Stripe
  let customerId = company?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    })
    customerId = customer.id

    // Sauvegarder le customer ID
    await supabase
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  // Calculer le prix TTC (HT + TVA)
  const priceTTC = calculateTTC(plan.priceHT)

  // Creer la session de checkout
  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${plan.name} - ${quantity} licence${quantity > 1 ? 's' : ''}`,
            description: plan.description,
          },
          unit_amount: priceTTC, // Prix TTC
          ...(plan.mode === 'subscription' && plan.interval && {
            recurring: {
              interval: plan.interval,
            },
          }),
        },
        quantity: quantity,
      },
    ],
    mode: plan.mode === 'subscription' ? 'subscription' : 'payment',
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
      quantity: quantity.toString(),
    },
    // Afficher les details de TVA
    automatic_tax: { enabled: false },
    invoice_creation: plan.mode === 'payment' ? {
      enabled: true,
      invoice_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
      },
    } : undefined,
  }

  // Ajouter l'essai gratuit de 14 jours si pas encore utilise et si c'est un abonnement
  if (!company?.trial_used && plan.mode === 'subscription') {
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        quantity: quantity.toString(),
      },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return { sessionId: session.id, url: session.url }
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status, subscription_plan, trial_used, subscription_end_date, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  return company
}

export async function createBillingPortalSession(baseUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vous devez etre connecte')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!company?.stripe_customer_id) {
    throw new Error('Aucun abonnement trouve')
  }

  const appUrl = baseUrl || getBaseUrl()

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${appUrl}/dashboard/subscription`,
  })

  return { url: session.url }
}

export async function cancelSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vous devez etre connecte')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!company?.stripe_subscription_id) {
    throw new Error('Aucun abonnement actif')
  }

  // Annuler a la fin de la periode en cours
  await stripe.subscriptions.update(company.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  // Mettre a jour le statut dans la base
  await supabase
    .from('companies')
    .update({ subscription_status: 'canceled' })
    .eq('user_id', user.id)

  return { success: true }
}

export async function reactivateSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vous devez etre connecte')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!company?.stripe_subscription_id) {
    throw new Error('Aucun abonnement trouve')
  }

  // Reactiver l'abonnement
  await stripe.subscriptions.update(company.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  // Mettre a jour le statut dans la base
  await supabase
    .from('companies')
    .update({ subscription_status: 'active' })
    .eq('user_id', user.id)

  return { success: true }
}
