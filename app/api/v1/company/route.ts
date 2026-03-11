import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiUser } from '@/lib/api-auth'

// GET /api/v1/company - Get company info
export async function GET(request: NextRequest) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) {
    return NextResponse.json(
      { error: 'Not found', message: 'Company not found' },
      { status: 404 }
    )
  }
  
  // Don't expose sensitive fields
  const { stripe_customer_id, stripe_subscription_id, ...safeData } = data
  
  return NextResponse.json({ data: safeData })
}

// PUT /api/v1/company - Update company info
export async function PUT(request: NextRequest) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: body.name,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        phone: body.phone,
        email: body.email,
        siret: body.siret,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }
    
    // Don't expose sensitive fields
    const { stripe_customer_id, stripe_subscription_id, ...safeData } = data
    
    return NextResponse.json({ data: safeData })
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }
}
