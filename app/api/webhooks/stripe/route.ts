import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Fonction pour creer le client admin (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const planId = session.metadata?.plan_id
        const licenseId = session.metadata?.license_id
        const resellerId = session.metadata?.reseller_id

        // Handle reseller license payment
        if (licenseId && resellerId) {
          // Get license details
          const { data: license } = await supabaseAdmin
            .from('licenses')
            .select('plan')
            .eq('id', licenseId)
            .single()

          if (license) {
            // Calculate expiration date
            let expiresAt: string | null = null
            if (license.plan === 'monthly') {
              expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } else if (license.plan === 'annual') {
              expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }

            // Activate the license
            await supabaseAdmin
              .from('licenses')
              .update({
                status: 'active',
                activated_at: new Date().toISOString(),
                expires_at: expiresAt,
                paid_at: new Date().toISOString(),
                payment_amount: session.amount_total,
              })
              .eq('id', licenseId)

            // Update reseller stats (increment total sales)
            await supabaseAdmin.rpc('increment_reseller_sales', {
              p_reseller_id: resellerId,
              p_amount: session.amount_total || 0,
            })
          }
          break
        }

        // Handle direct user payment
        if (userId && planId) {
          // Determiner le statut et la date de fin
          let subscriptionStatus = 'active'
          let subscriptionEndDate: string | null = null

          if (session.mode === 'subscription') {
            // Verifier si c'est un essai gratuit
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            if (subscription.trial_end) {
              subscriptionStatus = 'trial'
              subscriptionEndDate = new Date(subscription.trial_end * 1000).toISOString()
            } else {
              subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString()
            }
          } else if (planId === 'lifetime') {
            // Lifetime = pas de date de fin
            subscriptionEndDate = null
          }

          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: subscriptionStatus,
              subscription_plan: planId,
              subscription_end_date: subscriptionEndDate,
              trial_used: true,
              stripe_subscription_id: session.subscription || null,
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          const status = subscription.status === 'trialing' ? 'trial' : 
                         subscription.status === 'active' ? 'active' : 
                         subscription.status === 'canceled' ? 'canceled' : 'inactive'

          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'canceled',
              subscription_plan: null,
              stripe_subscription_id: null,
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Trouver l'utilisateur par son customer ID
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (company) {
          await supabaseAdmin
            .from('companies')
            .update({ subscription_status: 'past_due' })
            .eq('user_id', company.user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
