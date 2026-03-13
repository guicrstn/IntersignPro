'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Clock, PlusCircle, Ticket, Trash2, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HourContract, HourUsage } from '@/lib/types'
import useSWR, { mutate } from 'swr'

interface HourContractsProps {
  clientId: string
  clientName: string
}

const fetcher = async (url: string) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Non authentifie')
  
  const { data, error } = await supabase
    .from('hour_contracts')
    .select('*')
    .eq('client_id', url.split('/').pop())
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as HourContract[]
}

export function HourContracts({ clientId, clientName }: HourContractsProps) {
  const { data: contracts, error, isLoading } = useSWR(`/api/contracts/${clientId}`, fetcher)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state for new contract
  const [newContract, setNewContract] = useState({
    name: 'Contrat d\'heures',
    total_hours: 10,
    notes: '',
  })

  const handleAddContract = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Non authentifie')
      
      const { error } = await supabase
        .from('hour_contracts')
        .insert({
          user_id: user.id,
          client_id: clientId,
          name: newContract.name,
          total_hours: newContract.total_hours,
          remaining_hours: newContract.total_hours,
          notes: newContract.notes || null,
        })
      
      if (error) throw error
      
      mutate(`/api/contracts/${clientId}`)
      setIsAddDialogOpen(false)
      setNewContract({ name: 'Contrat d\'heures', total_hours: 10, notes: '' })
    } catch (err) {
      console.error('Erreur lors de l\'ajout du contrat:', err)
      alert('Erreur lors de l\'ajout du contrat')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('hour_contracts')
        .delete()
        .eq('id', contractId)
      
      if (error) throw error
      mutate(`/api/contracts/${clientId}`)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Erreur lors de la suppression du contrat')
    }
  }

  const getStatusBadge = (status: string, remaining: number, total: number) => {
    if (status === 'consumed' || remaining <= 0) {
      return <Badge variant="destructive">Epuise</Badge>
    }
    if (status === 'expired') {
      return <Badge variant="secondary">Expire</Badge>
    }
    if (remaining <= total * 0.2) {
      return <Badge className="bg-amber-500">Bientot epuise</Badge>
    }
    return <Badge className="bg-green-500">Actif</Badge>
  }

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100
    if (percentage <= 20) return 'bg-destructive'
    if (percentage <= 50) return 'bg-amber-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Contrats d&apos;heures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Contrats d&apos;heures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erreur lors du chargement des contrats</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Contrats d&apos;heures
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau contrat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau contrat d&apos;heures</DialogTitle>
              <DialogDescription>
                Creer un nouveau contrat d&apos;heures pour {clientName}. 
                1 ticket = 1 heure de travail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contract-name">Nom du contrat</Label>
                <Input
                  id="contract-name"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  placeholder="Ex: Contrat maintenance 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-hours">Nombre d&apos;heures (tickets)</Label>
                <Input
                  id="total-hours"
                  type="number"
                  min="1"
                  step="0.5"
                  value={newContract.total_hours}
                  onChange={(e) => setNewContract({ ...newContract, total_hours: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  1 ticket = 1 heure. Le deplacement compte pour 0.5 ticket.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={newContract.notes}
                  onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
                  placeholder="Informations supplementaires..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddContract} disabled={isSubmitting || newContract.total_hours <= 0}>
                {isSubmitting ? 'Creation...' : 'Creer le contrat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contracts && contracts.length > 0 ? (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{contract.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Cree le {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(contract.status, contract.remaining_hours, contract.total_hours)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedContractId(contract.id)
                        setIsHistoryDialogOpen(true)
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce contrat ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irreversible. Tout l&apos;historique d&apos;utilisation sera egalement supprime.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteContract(contract.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Heures restantes
                    </span>
                    <span className="font-medium">
                      {contract.remaining_hours} / {contract.total_hours} h
                    </span>
                  </div>
                  <Progress 
                    value={(contract.remaining_hours / contract.total_hours) * 100} 
                    className="h-2"
                  />
                </div>

                {contract.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    {contract.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="mx-auto h-8 w-8 mb-2" />
            <p>Aucun contrat d&apos;heures pour ce client</p>
            <p className="text-sm">Cliquez sur &quot;Nouveau contrat&quot; pour en creer un</p>
          </div>
        )}
      </CardContent>

      {/* History Dialog */}
      <UsageHistoryDialog 
        contractId={selectedContractId}
        isOpen={isHistoryDialogOpen}
        onClose={() => {
          setIsHistoryDialogOpen(false)
          setSelectedContractId(null)
        }}
      />
    </Card>
  )
}

// Component for viewing usage history
function UsageHistoryDialog({ 
  contractId, 
  isOpen, 
  onClose 
}: { 
  contractId: string | null
  isOpen: boolean
  onClose: () => void 
}) {
  const [usageHistory, setUsageHistory] = useState<(HourUsage & { intervention?: { intervention_number: string } })[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadHistory = async () => {
    if (!contractId) return
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hour_usage')
        .select('*, intervention:interventions(intervention_number)')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsageHistory(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load history when dialog opens
  if (isOpen && contractId && usageHistory.length === 0 && !isLoading) {
    loadHistory()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historique d&apos;utilisation</DialogTitle>
          <DialogDescription>
            Liste des heures deduites de ce contrat
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Chargement...</p>
          ) : usageHistory.length > 0 ? (
            <div className="space-y-3">
              {usageHistory.map((usage) => (
                <div key={usage.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {usage.intervention?.intervention_number || 'Deduction manuelle'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(usage.usage_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">
                        -{usage.hours_used + usage.travel_hours} h
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {usage.hours_used}h travail
                        {usage.travel_hours > 0 && ` + ${usage.travel_hours}h deplacement`}
                      </p>
                    </div>
                  </div>
                  {usage.description && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                      {usage.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Aucune utilisation enregistree
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
