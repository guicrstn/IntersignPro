import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  devis: 'Devis',
  commande: 'Bon de commande',
  livraison: 'Bon de livraison',
  facture: 'Facture',
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID requis' }, { status: 400 })
    }

    // Get document with client info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    if (!document.client?.email) {
      return NextResponse.json({ error: 'Le client n\'a pas d\'adresse email' }, { status: 400 })
    }

    if (document.status === 'signed') {
      return NextResponse.json({ error: 'Le document est deja signe' }, { status: 400 })
    }

    // Get company info for email
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token valid for 7 days

    // Save token
    const { error: tokenError } = await supabase
      .from('signature_tokens')
      .insert({
        document_id: documentId,
        token,
        client_email: document.client.email,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Error creating token:', tokenError)
      return NextResponse.json({ error: 'Erreur lors de la creation du token' }, { status: 500 })
    }

    // Build signature URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const signatureUrl = `${baseUrl}/sign/${token}`

    // Get document totals
    const { data: totals } = await supabase
      .from('document_totals')
      .select('*')
      .eq('document_id', documentId)
      .single()

    const documentTypeLabel = DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type
    const companyName = company?.name || 'Notre entreprise'

    // Send email with Resend
    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: document.client.email,
      subject: `${documentTypeLabel} ${document.document_number} - Signature requise`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${documentTypeLabel} a signer</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin-top: 0;">Bonjour <strong>${document.client.name}</strong>,</p>
            
            <p>Vous avez recu un ${documentTypeLabel.toLowerCase()} de la part de <strong>${companyName}</strong> qui necessite votre signature.</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Document:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${documentTypeLabel} ${document.document_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(document.document_date).toLocaleDateString('fr-FR')}</td>
                </tr>
                ${document.subject ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Objet:</td>
                  <td style="padding: 8px 0; text-align: right;">${document.subject}</td>
                </tr>
                ` : ''}
                ${totals ? `
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Montant TTC:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #0d9488;">${totals.total_ttc?.toFixed(2)} €</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Voir et signer le document
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">Ce lien est valide pendant 7 jours. Si vous avez des questions, n'hesitez pas a nous contacter.</p>
            
            ${company?.email ? `<p style="color: #6b7280; font-size: 14px;">Contact: ${company.email}</p>` : ''}
            ${company?.phone ? `<p style="color: #6b7280; font-size: 14px;">Telephone: ${company.phone}</p>` : ''}
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              Cet email a ete envoye via InterSign Pro
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
    }

    // Update document status to pending_signature
    await supabase
      .from('documents')
      .update({ status: 'pending_signature' })
      .eq('id', documentId)

    return NextResponse.json({ 
      success: true, 
      message: `Email envoye a ${document.client.email}` 
    })

  } catch (error) {
    console.error('Error in send-signature:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
