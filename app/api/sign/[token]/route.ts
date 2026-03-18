import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  devis: 'Devis',
  commande: 'Bon de commande',
  livraison: 'Bon de livraison',
  facture: 'Facture',
}

// GET - Fetch document data for signing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()

    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('signature_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expire' }, { status: 410 })
    }

    // Get document with all related data
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', tokenData.document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    // Get document lines
    const { data: lines } = await supabase
      .from('document_lines')
      .select('*')
      .eq('document_id', document.id)
      .order('line_order')

    // Get document totals
    const { data: totals } = await supabase
      .from('document_totals')
      .select('*')
      .eq('document_id', document.id)
      .single()

    // Get company info (owner of the document)
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', document.user_id)
      .single()

    return NextResponse.json({
      document: {
        id: document.id,
        document_number: document.document_number,
        document_type: document.document_type,
        document_date: document.document_date,
        subject: document.subject,
        notes: document.notes,
        terms: document.terms,
        status: document.status,
        client: document.client,
        lines: lines || [],
        totals,
        company,
      },
      token: {
        id: tokenData.id,
        expires_at: tokenData.expires_at,
        used_at: tokenData.used_at,
        signed_at: tokenData.signed_at,
      },
    })

  } catch (error) {
    console.error('Error fetching document for signing:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Sign the document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { signerName, signatureData } = await request.json()
    const supabase = await createClient()

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('signature_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expire' }, { status: 410 })
    }

    // Check if already signed
    if (tokenData.signed_at) {
      return NextResponse.json({ error: 'Document deja signe' }, { status: 400 })
    }

    // Update token with signature
    const { error: updateTokenError } = await supabase
      .from('signature_tokens')
      .update({
        used_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
        signer_name: signerName,
        signer_ip: ip,
        signature_data: signatureData,
      })
      .eq('id', tokenData.id)

    if (updateTokenError) {
      console.error('Error updating token:', updateTokenError)
      return NextResponse.json({ error: 'Erreur lors de la signature' }, { status: 500 })
    }

    // Get document info for client email
    const { data: document } = await supabase
      .from('documents')
      .select('*, client:clients(*)')
      .eq('id', tokenData.document_id)
      .single()

    // Update document signature
    const { error: updateSigError } = await supabase
      .from('document_signatures')
      .upsert({
        document_id: tokenData.document_id,
        signer_name: signerName,
        signer_email: document?.client?.email || null,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        ip_address: ip,
      })

    if (updateSigError) {
      console.error('Error updating document signature:', updateSigError)
    }

    // Update document status to signed
    const { error: updateDocError } = await supabase
      .from('documents')
      .update({ status: 'signed' })
      .eq('id', tokenData.document_id)

    if (updateDocError) {
      console.error('Error updating document status:', updateDocError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error signing document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
