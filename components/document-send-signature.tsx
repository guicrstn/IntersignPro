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
import { Send, Loader2, Copy, Check, Mail, MessageCircle, Link2, CheckCircle2 } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [signatureLink, setSignatureLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [mode, setMode] = useState<'choose' | 'email' | 'manual'>('choose')

  const sendByEmail = async () => {
    if (!clientEmail) {
      setError('Ce client n\'a pas d\'adresse email renseignee')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/send-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          clientEmail,
          clientName,
          documentType,
          documentNumber,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
        setIsLoading(false)
        return
      }

      setSignatureLink(data.signatureUrl)
      setEmailSent(true)
      setMode('email')

    } catch (err) {
      setError('Erreur de connexion')
      console.error(err)
    }

    setIsLoading(false)
  }

  const generateLinkOnly = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Non authentifie')
        setIsLoading(false)
        return
      }

      // Generate unique token
      const token = crypto.randomUUID() + '-' + crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Save token to database
      const { error: insertError } = await supabase
        .from('signature_tokens')
        .insert({
          token,
          document_id: documentId,
          expires_at: expiresAt.toISOString(),
        })

      if (insertError) {
        setError('Erreur lors de la creation du lien')
        setIsLoading(false)
        return
      }

      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'pending_signature' })
        .eq('id', documentId)

      const baseUrl = window.location.origin
      setSignatureLink(`${baseUrl}/sign/${token}`)
      setMode('manual')

    } catch (err) {
      setError('Erreur inattendue')
      console.error(err)
    }

    setIsLoading(false)
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
      window.open(`mailto:${clientEmail || ''}?subject=${subject}&body=${body}`)
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
    setEmailSent(false)
    setMode('choose')
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
            Envoyez le {DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} {documentNumber} a {clientName} pour signature.
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <p className="text-sm text-muted-foreground">
                {clientName} {clientEmail && `- ${clientEmail}`}
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-3">
              <Button 
                onClick={sendByEmail} 
                disabled={isLoading || !clientEmail}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer par email
                  </>
                )}
              </Button>
              {!clientEmail && (
                <p className="text-xs text-muted-foreground text-center">
                  Pas d'email renseigne pour ce client
                </p>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button 
                variant="outline"
                onClick={generateLinkOnly} 
                disabled={isLoading}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Generer un lien (envoi manuel)
              </Button>
            </div>
          </div>
        )}

        {mode === 'email' && emailSent && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Email envoye avec succes !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {clientName} recevra un email a {clientEmail} avec le lien de signature.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Lien de signature (copie)</Label>
              <div className="flex gap-2">
                <Input 
                  value={signatureLink || ''} 
                  readOnly 
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={resetAndClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}

        {mode === 'manual' && signatureLink && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lien de signature</Label>
              <div className="flex gap-2">
                <Input 
                  value={signatureLink} 
                  readOnly 
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Valide jusqu'au {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Envoyer via</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={openEmailClient} className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button variant="outline" onClick={openWhatsApp} className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Le client pourra voir et signer le document depuis ce lien.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
