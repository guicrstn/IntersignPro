'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Ticket, Car, Wrench, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HourContract } from '@/lib/types'

interface HourDeductionProps {
  interventionId: string
  clientId: string
  interventionNumber: string
  onDeducted?: () => void
}

export function HourDeductionButton({ 
  interventionId, 
  clientId, 
  interventionNumber,
  onDeducted 
}: HourDeductionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [contracts, setContracts] = useState<HourContract[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>('')
  const [workHours, setWorkHours] = useState<number>(1)
  const [includeTravel, setIncludeTravel] = useState(false)
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadyDeducted, setAlreadyDeducted] = useState(false)

  // Load contracts for the client
  useEffect(() => {
    const loadContracts = async () => {
      if (!isOpen) return
      
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        // Load active contracts
        const { data: contractsData, error: contractsError } = await supabase
          .from('hour_contracts')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('remaining_hours', 0)
          .order('created_at', { ascending: false })
        
        if (contractsError) throw contractsError
        setContracts(contractsData || [])
        
        // Check if already deducted
        const { data: existingUsage } = await supabase
          .from('hour_usage')
          .select('id')
          .eq('intervention_id', interventionId)
          .single()
        
        setAlreadyDeducted(!!existingUsage)
        
        // Auto-select if only one contract
        if (contractsData && contractsData.length === 1) {
          setSelectedContractId(contractsData[0].id)
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadContracts()
  }, [isOpen, clientId, interventionId])

  const handleDeduct = async () => {
    if (!selectedContractId) {
      alert('Veuillez selectionner un contrat')
      return
    }
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Non authentifie')
      
      const travelHours = includeTravel ? 0.5 : 0
      
      // Insert hour usage
      const { error } = await supabase
        .from('hour_usage')
        .insert({
          user_id: user.id,
          contract_id: selectedContractId,
          intervention_id: interventionId,
          hours_used: workHours,
          travel_hours: travelHours,
          description: description || `Intervention ${interventionNumber}`,
          usage_date: new Date().toISOString().split('T')[0],
        })
      
      if (error) throw error
      
      setIsOpen(false)
      setAlreadyDeducted(true)
      onDeducted?.()
    } catch (err) {
      console.error('Erreur lors de la deduction:', err)
      alert('Erreur lors de la deduction des heures')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedContract = contracts.find(c => c.id === selectedContractId)
  const totalDeduction = workHours + (includeTravel ? 0.5 : 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={alreadyDeducted ? "outline" : "default"} className="gap-2">
          {alreadyDeducted ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Heures deduites
            </>
          ) : (
            <>
              <Ticket className="h-4 w-4" />
              Decompter les heures
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decompter les heures</DialogTitle>
          <DialogDescription>
            Deduire les heures passees sur l&apos;intervention {interventionNumber} du contrat d&apos;heures du client.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Chargement des contrats...
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-8 text-center">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun contrat d&apos;heures actif pour ce client</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez un contrat depuis la fiche client
            </p>
          </div>
        ) : alreadyDeducted ? (
          <div className="py-8 text-center">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="font-medium">Heures deja deduites</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les heures de cette intervention ont deja ete decomptees
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Contract Selection */}
            <div className="space-y-2">
              <Label>Contrat d&apos;heures</Label>
              <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un contrat" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex items-center gap-2">
                        <span>{contract.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {contract.remaining_hours}h restantes
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Hours */}
            <div className="space-y-2">
              <Label htmlFor="work-hours" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Heures de travail
              </Label>
              <Input
                id="work-hours"
                type="number"
                min="0.5"
                step="0.5"
                value={workHours}
                onChange={(e) => setWorkHours(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                1 ticket = 1 heure de travail
              </p>
            </div>

            {/* Travel Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Deplacement</p>
                  <p className="text-xs text-muted-foreground">+0.5 ticket</p>
                </div>
              </div>
              <Button
                type="button"
                variant={includeTravel ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeTravel(!includeTravel)}
              >
                {includeTravel ? 'Inclus' : 'Ajouter'}
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="deduction-desc">Description (optionnel)</Label>
              <Textarea
                id="deduction-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details supplementaires..."
                rows={2}
              />
            </div>

            {/* Summary */}
            {selectedContract && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Resume</h4>
                <div className="flex justify-between text-sm">
                  <span>Heures de travail</span>
                  <span>{workHours}h</span>
                </div>
                {includeTravel && (
                  <div className="flex justify-between text-sm">
                    <span>Deplacement</span>
                    <span>0.5h</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total a deduire</span>
                  <span className="text-destructive">-{totalDeduction}h</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Solde apres deduction</span>
                  <span>{Math.max(0, selectedContract.remaining_hours - totalDeduction)}h</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {alreadyDeducted || contracts.length === 0 ? 'Fermer' : 'Annuler'}
          </Button>
          {!alreadyDeducted && contracts.length > 0 && (
            <Button 
              onClick={handleDeduct} 
              disabled={isSubmitting || !selectedContractId || workHours <= 0}
            >
              <Clock className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Deduction...' : `Deduire ${totalDeduction}h`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
