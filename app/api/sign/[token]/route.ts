import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Update document signature
    const { error: updateSigError } = await supabase
      .from('document_signatures')
      .upsert({
        document_id: tokenData.document_id,
        signer_name: signerName,
        signer_email: tokenData.client_email,
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

    // Get document and owner info for notification
    const { data: document } = await supabase
      .from('documents')
      .select('*, client:clients(*)')
      .eq('id', tokenData.document_id)
      .single()

    // Get user email for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', document?.user_id)
      .single()

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, email')
      .eq('user_id', document?.user_id)
      .single()

    const ownerEmail = company?.email || profile?.email

    // Send notification email to document owner
    if (ownerEmail && document) {
      const documentTypeLabel = DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type
      
      try {
        await resend.emails.send({
          from: 'InterSign Pro <onboarding@resend.dev>',
          to: ownerEmail,
          subject: `${documentTypeLabel} ${document.document_number} signe par ${signerName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Document signe !</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Bonjour,</p>
                
                <p>Le ${documentTypeLabel.toLowerCase()} <strong>${document.document_number}</strong> a ete signe par <strong>${signerName}</strong>.</p>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Document:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: 600;">${documentTypeLabel} ${document.document_number}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Client:</td>
                      <td style="padding: 8px 0; text-align: right;">${document.client?.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Signe par:</td>
                      <td style="padding: 8px 0; text-align: right;">${signerName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                      <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}</td>
                    </tr>
                  </table>
                </div>
                
                <p>Vous pouvez consulter le document dans votre espace InterSign Pro.</p>
              </div>
            </body>
            </html>
          `,
        })
      } catch (emailError) {
        console.error('Error sending notification email:', emailError)
        // Don't fail the signature if notification fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error signing document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
