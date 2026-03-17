'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowRight, Loader2, ShoppingCart, Truck, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentType } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types'

interface DocumentConvertProps {
  documentId: string
  currentType: DocumentType
  nextType: DocumentType
}

const conversionConfig: Record<DocumentType, { icon: React.ElementType; label: string }> = {
  devis: { icon: ShoppingCart, label: 'Devis' },
  commande: { icon: ShoppingCart, label: 'Commande' },
  livraison: { icon: Truck, label: 'Bon de livraison' },
  facture: { icon: Receipt, label: 'Facture' },
}

export function DocumentConvert({ documentId, currentType, nextType }: DocumentConvertProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetConfig = conversionConfig[nextType]

  const handleConvert = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Non authentifie')
      setIsLoading(false)
      return
    }

    // Get original document with lines
    const { data: originalDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!originalDoc) {
      setError('Document original non trouve')
      setIsLoading(false)
      return
    }

    // Get lines
    const { data: originalLines } = await supabase
      .from('document_lines')
      .select('*')
      .eq('document_id', documentId)

    // Get totals
    const { data: originalTotals } = await supabase
      .from('document_totals')
      .select('*')
      .eq('document_id', documentId)
      .single()

    // Get next document number
    const { data: sequence } = await supabase
      .from('document_sequences')
      .select('*')
      .eq('user_id', user.id)
      .eq('document_type', nextType)
      .single()

    let nextNumber = 1
    if (sequence) {
      nextNumber = sequence.last_number + 1
      await supabase
        .from('document_sequences')
        .update({ last_number: nextNumber })
        .eq('id', sequence.id)
    } else {
      await supabase
        .from('document_sequences')
        .insert({ user_id: user.id, document_type: nextType, last_number: 1, prefix: nextType.toUpperCase().substring(0, 3) })
    }

    const prefix = nextType === 'devis' ? 'DEV' : nextType === 'commande' ? 'CMD' : nextType === 'livraison' ? 'BL' : 'FAC'
    const documentNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`

    // Create new document
    const { data: newDoc, error: createError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: originalDoc.client_id,
        document_type: nextType,
        document_number: documentNumber,
        parent_document_id: documentId,
        status: 'draft',
        document_date: new Date().toISOString().split('T')[0],
        subject: originalDoc.subject,
        notes: originalDoc.notes,
        terms: originalDoc.terms,
      })
      .select()
      .single()

    if (createError || !newDoc) {
      setError('Erreur lors de la creation: ' + createError?.message)
      setIsLoading(false)
      return
    }

    // Copy lines
    if (originalLines && originalLines.length > 0) {
      const linesToInsert = originalLines.map((line) => ({
        document_id: newDoc.id,
        line_order: line.line_order,
        line_type: line.line_type,
        reference: line.reference,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unit_price_ht: line.unit_price_ht,
        discount_percent: line.discount_percent,
        discount_amount: line.discount_amount,
        tva_rate: line.tva_rate,
        total_ht: line.total_ht,
        total_tva: line.total_tva,
        total_ttc: line.total_ttc,
      }))

      await supabase.from('document_lines').insert(linesToInsert)
    }

    // Copy totals
    if (originalTotals) {
      await supabase.from('document_totals').insert({
        document_id: newDoc.id,
        total_ht: originalTotals.total_ht,
        total_discount: originalTotals.total_discount,
        total_ht_after_discount: originalTotals.total_ht_after_discount,
        tva_20: originalTotals.tva_20,
        tva_10: originalTotals.tva_10,
        tva_5_5: originalTotals.tva_5_5,
        tva_2_1: originalTotals.tva_2_1,
        total_tva: originalTotals.total_tva,
        total_ttc: originalTotals.total_ttc,
      })
    }

    // Mark original as converted
    await supabase
      .from('documents')
      .update({ status: 'converted' })
      .eq('id', documentId)

    setOpen(false)
    router.push(`/dashboard/documents/${newDoc.id}`)
  }

  const Icon = targetConfig.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ArrowRight className="mr-2 h-4 w-4" />
          Convertir en {DOCUMENT_TYPE_LABELS[nextType]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir le document</DialogTitle>
          <DialogDescription>
            Voulez-vous creer un(e) {DOCUMENT_TYPE_LABELS[nextType]} a partir de ce {DOCUMENT_TYPE_LABELS[currentType]} ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Le {DOCUMENT_TYPE_LABELS[currentType]} sera marque comme converti et un nouveau document sera cree avec les memes lignes.
          </p>

          <Button
            className="w-full"
            onClick={handleConvert}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            Creer {DOCUMENT_TYPE_LABELS[nextType]}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
