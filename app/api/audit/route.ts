import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog, createDocumentVersion, type AuditAction, type ActorType } from '@/lib/audit-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      documentId, 
      action, 
      actionDetails,
      actorType = 'user',
      actorName,
      actorEmail,
      createVersion = false,
      versionReason
    } = body as {
      documentId: string
      action: AuditAction
      actionDetails?: Record<string, unknown>
      actorType?: ActorType
      actorName?: string
      actorEmail?: string
      createVersion?: boolean
      versionReason?: string
    }

    if (!documentId || !action) {
      return NextResponse.json({ error: 'documentId et action requis' }, { status: 400 })
    }

    // Verifier que le document appartient a l'utilisateur
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    // Recuperer les informations IP et User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Si demande de creation de version avant l'action
    if (createVersion) {
      const versionResult = await createDocumentVersion(
        documentId, 
        user.id, 
        versionReason || `Avant ${action}`
      )
      if (!versionResult.success) {
        console.error('Erreur creation version:', versionResult.error)
      }
    }

    // Creer le log d'audit
    const result = await createAuditLog({
      documentId,
      userId: user.id,
      action,
      actionDetails,
      actorType,
      actorName: actorName || user.email,
      actorEmail: actorEmail || user.email,
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API audit:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// GET - Recuperer l'historique d'audit d'un document
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId requis' }, { status: 400 })
    }

    // Verifier que le document appartient a l'utilisateur
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    // Recuperer les logs d'audit
    const { data: logs, error: logsError } = await supabase
      .from('document_audit_logs')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // Recuperer les versions
    const { data: versions, error: versionsError } = await supabase
      .from('document_versions')
      .select('id, version_number, reason, content_hash, created_at')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (versionsError) {
      return NextResponse.json({ error: versionsError.message }, { status: 500 })
    }

    return NextResponse.json({ logs, versions })
  } catch (error) {
    console.error('Erreur API audit GET:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
