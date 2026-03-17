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
import { Send, Loader2, CheckCircle, Mail } from 'lucide-react'
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
  clientName
}: DocumentSendSignatureProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/send-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Erreur de connexion')
    }
    setIsLoading(false)
  }

  if (!clientEmail) {
    return (
      <Button variant="outline" disabled title="Le client n'a pas d'email">
        <Send className="mr-2 h-4 w-4" />
        Envoyer pour signature
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        // Reset state when closing
        setTimeout(() => {
          setSuccess(false)
          setError(null)
        }, 200)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Envoyer pour signature
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer pour signature</DialogTitle>
          <DialogDescription>
            Envoyer ce {DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} par email pour signature electronique
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Email envoye !</h3>
            <p className="text-muted-foreground">
              Un email a ete envoye a <strong>{clientEmail}</strong> avec un lien pour signer le document.
            </p>
            <Button className="mt-4" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Document</span>
                <span className="font-medium">{DOCUMENT_TYPE_LABELS[documentType]} {documentNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destinataire</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {clientEmail}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Le client recevra un email avec un lien securise pour consulter et signer le document. 
              Le lien sera valide pendant 7 jours.
            </p>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSend} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer l'email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
