'use server'

import { stripe } from '@/lib/stripe'
import { PRODUCTS, type PlanId } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

export async function createCheckoutSession(planId: PlanId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vous devez etre connecte pour souscrire a un abonnement')
  }

  const plan = PRODUCTS.find(p => p.id === planId)
  if (!plan) {
    throw new Error('Plan invalide')
  }

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

  // Creer la session de checkout
  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          ...(plan.mode === 'subscription' && plan.interval && {
            recurring: {
              interval: plan.interval,
            },
          }),
        },
        quantity: 1,
      },
    ],
    mode: plan.mode === 'subscription' ? 'subscription' : 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
    },
  }

  // Ajouter l'essai gratuit de 14 jours si pas encore utilise et si c'est un abonnement
  if (!company?.trial_used && plan.mode === 'subscription') {
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
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
    .select('subscription_status, subscription_plan, trial_used, subscription_end_date')
    .eq('user_id', user.id)
    .single()

  return company
}
