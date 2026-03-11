import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api-auth'

// POST /api/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    // Generate new API key
    const { key, prefix, hash } = generateApiKey()
    
    // Store in database
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: hash,
        key_prefix: prefix,
      })
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      )
    }
    
    // Return the full key only once
    return NextResponse.json({
      key,
      prefix,
      name,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
