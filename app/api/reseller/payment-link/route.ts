import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    // Verify user is a reseller
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!reseller || reseller.status !== 'active') {
      return NextResponse.json({ error: 'Revendeur non autorise' }, { status: 403 })
    }

    const body = await request.json()
    const { licenseId } = body

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID requis' }, { status: 400 })
    }

    // Get license details
    const { data: license } = await supabase
      .from('licenses')
      .select('*, license_options(*)')
      .eq('id', licenseId)
      .eq('reseller_id', reseller.id)
      .single()

    if (!license) {
      return NextResponse.json({ error: 'Licence non trouvee' }, { status: 404 })
    }

    // Calculate price
    const planPrices: Record<string, number> = {
      monthly: 2900, // 29€ en centimes
      annual: 29000, // 290€
      lifetime: 59000, // 590€
    }

    let totalPrice = planPrices[license.plan] || 2900

    // Add options prices
    if (license.license_options) {
      const optionPrices: Record<string, Record<string, number>> = {
        quote_import: { monthly: 1000, annual: 10000, lifetime: 15000 },
      }

      license.license_options.forEach((opt: { option_key: string }) => {
        const optPrice = optionPrices[opt.option_key]?.[license.plan]
        if (optPrice) totalPrice += optPrice
      })
    }

    // Get the base URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create a Stripe Checkout session for the reseller's customer
    const session = await stripe.checkout.sessions.create({
      mode: license.plan === 'lifetime' ? 'payment' : 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `InterSign Pro - ${license.plan === 'monthly' ? 'Mensuel' : license.plan === 'annual' ? 'Annuel' : 'Lifetime'}`,
              description: `Licence pour ${license.client_name}`,
            },
            unit_amount: totalPrice,
            ...(license.plan !== 'lifetime' && {
              recurring: {
                interval: license.plan === 'monthly' ? 'month' : 'year',
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/activate?license=${license.license_key}&success=true`,
      cancel_url: `${baseUrl}/activate?license=${license.license_key}&canceled=true`,
      customer_email: license.client_email,
      metadata: {
        license_id: license.id,
        reseller_id: reseller.id,
        license_key: license.license_key,
      },
    })

    // Update license with payment link info
    await supabase
      .from('licenses')
      .update({
        stripe_payment_link: session.url,
        stripe_session_id: session.id,
      })
      .eq('id', license.id)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
