'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Loader2, Copy, Check, Mail, MessageCircle, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentType } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types'

interface DocumentSendSignatureProps {
  documentId: string
  documentNumber: string
  documentType: DocumentType
  clientEmail: string | null
  clientName: string
}

export function DocumentSendSignature({
  documentId,
  documentNumber,
  documentType,
  clientEmail,
  clientName,
}: DocumentSendSignatureProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [signatureLink, setSignatureLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSignatureLink = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Non authentifie')
        setIsGenerating(false)
        return
      }

      // Generate unique token
      const token = crypto.randomUUID() + '-' + crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

      // Save token to database
      const { error: insertError } = await supabase
        .from('signature_tokens')
        .insert({
          token,
          document_id: documentId,
          expires_at: expiresAt.toISOString(),
        })

      if (insertError) {
        setError('Erreur lors de la creation du lien: ' + insertError.message)
        setIsGenerating(false)
        return
      }

      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'pending_signature' })
        .eq('id', documentId)

      // Generate link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/sign/${token}`
      setSignatureLink(link)

    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsGenerating(false)
  }

  const copyToClipboard = async () => {
    if (signatureLink) {
      await navigator.clipboard.writeText(signatureLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openEmailClient = () => {
    if (signatureLink) {
      const subject = encodeURIComponent(`${DOCUMENT_TYPE_LABELS[documentType]} ${documentNumber} a signer`)
      const body = encodeURIComponent(
        `Bonjour ${clientName},\n\n` +
        `Veuillez trouver ci-dessous le lien pour consulter et signer votre ${DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} ${documentNumber}:\n\n` +
        `${signatureLink}\n\n` +
        `Ce lien est valide pendant 7 jours.\n\n` +
        `Cordialement`
      )
      const emailTo = clientEmail || ''
      window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`)
    }
  }

  const openWhatsApp = () => {
    if (signatureLink) {
      const text = encodeURIComponent(
        `Bonjour ${clientName},\n\n` +
        `Voici le lien pour signer votre ${DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} ${documentNumber}:\n\n` +
        `${signatureLink}`
      )
      window.open(`https://wa.me/?text=${text}`)
    }
  }

  const resetAndClose = () => {
    setSignatureLink(null)
    setCopied(false)
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetAndClose()
      else setOpen(true)
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Envoyer pour signature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer pour signature</DialogTitle>
          <DialogDescription>
            Generez un lien de signature pour {clientName} et envoyez-le par email, WhatsApp ou autre.
          </DialogDescription>
        </DialogHeader>

        {!signatureLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document</Label>
              <p className="text-sm text-muted-foreground">
                {DOCUMENT_TYPE_LABELS[documentType]} {documentNumber}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <p className="text-sm text-muted-foreground">
                {clientName} {clientEmail && `(${clientEmail})`}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Validite</Label>
              <p className="text-sm text-muted-foreground">
                Le lien sera valide pendant 7 jours
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button 
              onClick={generateSignatureLink} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Generer le lien de signature
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lien de signature</Label>
              <div className="flex gap-2">
                <Input 
                  value={signatureLink} 
                  readOnly 
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Valide jusqu au {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Envoyer via</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={openEmailClient}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={openWhatsApp}
                  className="flex-1"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Le client pourra voir le document et le signer directement depuis ce lien.
                Le statut passera automatiquement a "Signe" une fois la signature effectuee.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
