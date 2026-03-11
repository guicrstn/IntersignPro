import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiUser } from '@/lib/api-auth'

// GET /api/v1/interventions - List all interventions
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
  const status = searchParams.get('status')
  const clientId = searchParams.get('client_id')
  
  let query = supabase
    .from('interventions')
    .select('*, client:clients(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  if (clientId) {
    query = query.eq('client_id', clientId)
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

// POST /api/v1/interventions - Create a new intervention
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
    if (!body.client_id || !body.description) {
      return NextResponse.json(
        { error: 'Validation error', message: 'client_id and description are required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Verify client belongs to user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', body.client_id)
      .eq('user_id', user.id)
      .single()
    
    if (!client) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Client not found' },
        { status: 400 }
      )
    }
    
    // Generate intervention number
    const { data: numberData } = await supabase.rpc('generate_intervention_number', {
      p_user_id: user.id,
    })
    
    const interventionNumber = numberData || `INT-${new Date().getFullYear()}-0001`
    
    const { data, error } = await supabase
      .from('interventions')
      .insert({
        user_id: user.id,
        client_id: body.client_id,
        intervention_number: interventionNumber,
        description: body.description,
        date: body.date || new Date().toISOString().split('T')[0],
        status: 'draft',
        quote_lines: body.quote_lines || null,
      })
      .select('*, client:clients(*)')
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
