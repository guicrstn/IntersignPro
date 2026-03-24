import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  setup2FA,
  enable2FA,
  disable2FA,
  check2FAStatus,
  verify2FALogin,
} from '@/lib/two-factor-service'

// GET - Check 2FA status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const status = await check2FAStatus(user.id)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking 2FA status:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Setup, Enable, Disable, or Verify 2FA
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { action, code } = body

    switch (action) {
      case 'setup': {
        const result = await setup2FA(user.id, user.email!)
        return NextResponse.json(result)
      }

      case 'enable': {
        if (!code) {
          return NextResponse.json({ error: 'Code requis' }, { status: 400 })
        }
        const result = await enable2FA(user.id, code)
        return NextResponse.json(result)
      }

      case 'disable': {
        if (!code) {
          return NextResponse.json({ error: 'Code requis' }, { status: 400 })
        }
        const result = await disable2FA(user.id, code)
        return NextResponse.json(result)
      }

      case 'verify': {
        if (!code) {
          return NextResponse.json({ error: 'Code requis' }, { status: 400 })
        }
        const result = await verify2FALogin(user.id, code)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in 2FA action:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Remove 2FA (requires code)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    }

    const result = await disable2FA(user.id, code)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
