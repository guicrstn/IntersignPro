'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { Trash2 } from 'lucide-react'

interface InterventionDeleteButtonProps {
  interventionId: string
  interventionNumber: string
}

export function InterventionDeleteButton({ interventionId, interventionNumber }: InterventionDeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete associated hour_usage records first
    await supabase.from('hour_usage').delete().eq('intervention_id', interventionId)
    
    // Delete the intervention
    await supabase.from('interventions').delete().eq('id', interventionId)

    router.push('/dashboard/interventions')
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;intervention ?</AlertDialogTitle>
          <AlertDialogDescription>
            Etes-vous sur de vouloir supprimer l&apos;intervention &quot;{interventionNumber}&quot; ?
            Cette action est irreversible et supprimera egalement l&apos;historique 
            de decompte d&apos;heures associe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
