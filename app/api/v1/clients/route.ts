import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiUser } from '@/lib/api-auth'

// GET /api/v1/clients - List all clients
export async function GET(request: NextRequest) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  const supabase = await createClient()
  
  // Get query params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('search')
  
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  
  const { data, error, count } = await query
  
  if (error) {
    return NextResponse.json(
      { error: 'Database error', message: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    data,
    pagination: {
      total: count,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    },
  })
}

// POST /api/v1/clients - Create a new client
export async function POST(request: NextRequest) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.address) {
      return NextResponse.json(
        { error: 'Validation error', message: 'name and address are required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address,
        city: body.city || null,
        postal_code: body.postal_code || null,
        notes: body.notes || null,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }
}
