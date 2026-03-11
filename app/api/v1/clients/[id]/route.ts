import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiUser } from '@/lib/api-auth'

// GET /api/v1/clients/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) {
    return NextResponse.json(
      { error: 'Not found', message: 'Client not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ data })
}

// PUT /api/v1/clients/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  const { id } = await params
  
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Check ownership
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: 'Client not found' },
        { status: 404 }
      )
    }
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }
}

// DELETE /api/v1/clients/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    )
  }
  
  const { id } = await params
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    return NextResponse.json(
      { error: 'Database error', message: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ success: true }, { status: 200 })
}
