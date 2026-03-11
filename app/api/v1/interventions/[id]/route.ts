import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiUser } from '@/lib/api-auth'

// GET /api/v1/interventions/:id
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
    .from('interventions')
    .select('*, client:clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) {
    return NextResponse.json(
      { error: 'Not found', message: 'Intervention not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ data })
}

// PUT /api/v1/interventions/:id
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
      .from('interventions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: 'Intervention not found' },
        { status: 404 }
      )
    }
    
    // Can't edit signed interventions
    if (existing.status === 'signed') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cannot edit a signed intervention' },
        { status: 403 }
      )
    }
    
    const { data, error } = await supabase
      .from('interventions')
      .update({
        description: body.description,
        date: body.date,
        quote_lines: body.quote_lines,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, client:clients(*)')
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

// DELETE /api/v1/interventions/:id
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
  
  // Check if intervention is signed
  const { data: existing } = await supabase
    .from('interventions')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (existing?.status === 'signed') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Cannot delete a signed intervention' },
      { status: 403 }
    )
  }
  
  const { error } = await supabase
    .from('interventions')
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
