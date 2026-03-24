import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ChorusProService } from '@/lib/chorus-pro-service'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non authentifie' },
        { status: 401 }
      )
    }

    const service = new ChorusProService()
    const initialized = await service.initialize(user.id)

    if (!initialized) {
      return NextResponse.json({
        success: false,
        message: 'Chorus Pro non configure ou desactive'
      })
    }

    if (!service.isConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Configuration incomplete. Verifiez tous les champs obligatoires.'
      })
    }

    const result = await service.testConnection()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Chorus Pro test error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors du test' },
      { status: 500 }
    )
  }
}
