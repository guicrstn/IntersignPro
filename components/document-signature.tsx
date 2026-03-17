'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SignatureCanvas } from '@/components/signature-canvas'
import { PenTool, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentType } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types'

interface DocumentSignatureProps {
  documentId: string
  documentType: DocumentType
  documentNumber?: string
}

export function DocumentSignature({ documentId, documentType, documentNumber = '' }: DocumentSignatureProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = async () => {
    if (!signerName.trim()) {
      setError('Veuillez entrer le nom du signataire')
      return
    }
    if (!signatureData) {
      setError('Veuillez signer le document')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'signed',
        signature_data: signatureData,
        signer_name: signerName,
        signed_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateError) {
      setError('Erreur lors de la signature: ' + updateError.message)
      setIsLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PenTool className="mr-2 h-4 w-4" />
          Faire signer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signature du {DOCUMENT_TYPE_LABELS[documentType]}</DialogTitle>
          <DialogDescription>
            {documentNumber} - Faites signer le document par le client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signer">Nom du signataire *</Label>
            <Input
              id="signer"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Nom et prenom du signataire"
            />
          </div>

          <div className="space-y-2">
            <Label>Signature *</Label>
            <SignatureCanvas
              onSignatureChange={setSignatureData}
              width={400}
              height={200}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSign} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Valider la signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
