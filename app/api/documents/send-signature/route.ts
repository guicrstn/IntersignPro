import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types'
import type { DocumentType } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const { documentId, clientEmail, clientName, documentType, documentNumber } = await request.json()

    if (!documentId || !clientEmail) {
      return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 })
    }

    // Get company info for email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('user_id', user.id)
      .single()

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days validity

    // Save token to database
    const { error: tokenError } = await supabase
      .from('signature_tokens')
      .insert({
        token,
        document_id: documentId,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json({ error: 'Erreur lors de la creation du token' }, { status: 500 })
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'pending_signature' })
      .eq('id', documentId)

    // Build signature URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const signatureUrl = `${baseUrl}/sign/${token}`

    const documentTypeLabel = DOCUMENT_TYPE_LABELS[documentType as DocumentType] || documentType
    const companyName = company?.name || 'Notre entreprise'

    // Send email
    await sendEmail({
      to: clientEmail,
      subject: `${documentTypeLabel} ${documentNumber} - Signature requise`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">InterSign Pro</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${clientName}</strong>,</p>
            
            <p style="margin-bottom: 20px;">
              <strong>${companyName}</strong> vous a envoye un(e) <strong>${documentTypeLabel.toLowerCase()}</strong> 
              (${documentNumber}) qui necessite votre signature.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Document a signer:</p>
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0d9488;">${documentTypeLabel} ${documentNumber}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureUrl}" 
                 style="display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Voir et signer le document
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
              Ce lien est valable pendant 7 jours. Si vous avez des questions, 
              contactez directement ${companyName}.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Envoye via InterSign Pro</p>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Email envoye a ${clientEmail}`,
      signatureUrl 
    })

  } catch (error) {
    console.error('Send signature error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi' },
      { status: 500 }
    )
  }
}
