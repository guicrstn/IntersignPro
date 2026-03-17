'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentDeleteButtonProps {
  documentId: string
  documentNumber: string
}

export function DocumentDeleteButton({ documentId, documentNumber }: DocumentDeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete lines first
    await supabase.from('document_lines').delete().eq('document_id', documentId)
    
    // Delete totals
    await supabase.from('document_totals').delete().eq('document_id', documentId)
    
    // Delete document
    const { error } = await supabase.from('documents').delete().eq('id', documentId)

    if (error) {
      console.error('Error deleting document:', error)
      setIsDeleting(false)
      return
    }

    router.push('/dashboard/documents')
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
          <AlertDialogDescription>
            Etes-vous sur de vouloir supprimer le document {documentNumber} ? Cette action est irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
