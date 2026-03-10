import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Verifier que c'est une image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit etre une image' }, { status: 400 })
    }

    // Recuperer l'ancien logo pour le supprimer
    const { data: company } = await supabase
      .from('companies')
      .select('logo_url')
      .eq('user_id', user.id)
      .single()

    // Supprimer l'ancien logo si existant
    if (company?.logo_url) {
      try {
        await del(company.logo_url)
      } catch (e) {
        // Ignorer les erreurs de suppression
        console.error('Erreur suppression ancien logo:', e)
      }
    }

    // Upload du nouveau logo
    const blob = await put(`logos/${user.id}/${file.name}`, file, {
      access: 'private',
    })

    // Mettre a jour la company avec le pathname du logo
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: blob.pathname })
      .eq('user_id', user.id)

    if (error) {
      // Supprimer le blob si la mise a jour echoue
      await del(blob.url)
      throw error
    }

    // Retourner l'URL de l'API pour servir le logo
    return NextResponse.json({ url: `/api/logo?pathname=${encodeURIComponent(blob.pathname)}` })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json({ error: 'Echec de l\'upload' }, { status: 500 })
  }
}
