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
import type { DocumentType, DocumentWithDetails } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types'

interface DocumentConvertProps {
  document: DocumentWithDetails
}

const conversionMap: Record<DocumentType, { next: DocumentType; icon: React.ElementType; label: string }[]> = {
  devis: [{ next: 'commande', icon: ShoppingCart, label: 'Convertir en Commande' }],
  commande: [
    { next: 'livraison', icon: Truck, label: 'Creer Bon de livraison' },
    { next: 'facture', icon: Receipt, label: 'Creer Facture' },
  ],
  livraison: [{ next: 'facture', icon: Receipt, label: 'Creer Facture' }],
  facture: [],
}

export function DocumentConvert({ document }: DocumentConvertProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const conversions = conversionMap[document.document_type]
  
  if (conversions.length === 0 || document.status !== 'signed') {
    return null
  }

  const handleConvert = async (targetType: DocumentType) => {
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

    // Get next document number
    const { data: sequence } = await supabase
      .from('document_sequences')
      .select('*')
      .eq('user_id', user.id)
      .eq('document_type', targetType)
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
        .insert({ user_id: user.id, document_type: targetType, last_number: 1, prefix: targetType.toUpperCase().substring(0, 3) })
    }

    const prefix = targetType === 'devis' ? 'DEV' : targetType === 'commande' ? 'CMD' : targetType === 'livraison' ? 'BL' : 'FAC'
    const documentNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`

    // Create new document
    const { data: newDoc, error: createError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: document.client_id,
        document_type: targetType,
        document_number: documentNumber,
        parent_document_id: document.id,
        status: 'draft',
        document_date: new Date().toISOString().split('T')[0],
        subject: document.subject,
        notes: document.notes,
        terms: document.terms,
      })
      .select()
      .single()

    if (createError || !newDoc) {
      setError('Erreur lors de la creation: ' + createError?.message)
      setIsLoading(false)
      return
    }

    // Copy lines
    if (document.lines && document.lines.length > 0) {
      const linesToInsert = document.lines.map((line) => ({
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
    if (document.totals) {
      await supabase.from('document_totals').insert({
        document_id: newDoc.id,
        total_ht: document.totals.total_ht,
        total_discount: document.totals.total_discount,
        total_ht_after_discount: document.totals.total_ht_after_discount,
        tva_20: document.totals.tva_20,
        tva_10: document.totals.tva_10,
        tva_5_5: document.totals.tva_5_5,
        tva_2_1: document.totals.tva_2_1,
        total_tva: document.totals.total_tva,
        total_ttc: document.totals.total_ttc,
      })
    }

    // Mark original as converted
    await supabase
      .from('documents')
      .update({ status: 'converted' })
      .eq('id', document.id)

    setOpen(false)
    router.push(`/dashboard/documents/${newDoc.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRight className="mr-2 h-4 w-4" />
          Convertir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir le document</DialogTitle>
          <DialogDescription>
            Choisissez le type de document a creer a partir de ce {DOCUMENT_TYPE_LABELS[document.document_type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {conversions.map((conv) => (
            <Button
              key={conv.next}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConvert(conv.next)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <conv.icon className="mr-2 h-4 w-4" />
              )}
              {conv.label}
            </Button>
          ))}

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
