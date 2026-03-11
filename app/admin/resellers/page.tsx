'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  Mail, 
  Phone,
  Percent,
  Search,
  RefreshCw
} from 'lucide-react'
import type { Reseller } from '@/lib/types'

type ResellerWithStats = Reseller & {
  licenses_count: number
}

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<ResellerWithStats[]>([])
  const [filteredResellers, setFilteredResellers] = useState<ResellerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
  
  // Dialog states
  const [selectedReseller, setSelectedReseller] = useState<ResellerWithStats | null>(null)
  const [dialogType, setDialogType] = useState<'approve' | 'suspend' | 'reactivate' | 'commission' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState('')

  const fetchResellers = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: resellersData } = await supabase
      .from('resellers')
      .select('*')
      .order('created_at', { ascending: false })

    if (resellersData) {
      // Get licenses count for each reseller
      const resellersWithStats = await Promise.all(
        resellersData.map(async (reseller) => {
          const { count } = await supabase
            .from('licenses')
            .select('*', { count: 'exact', head: true })
            .eq('reseller_id', reseller.id)

          return {
            ...reseller,
            licenses_count: count || 0,
          }
        })
      )
      setResellers(resellersWithStats)
      setFilteredResellers(resellersWithStats)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchResellers()
  }, [])

  useEffect(() => {
    let filtered = resellers

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.company_name.toLowerCase().includes(query) ||
        r.contact_name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query)
      )
    }

    setFilteredResellers(filtered)
  }, [resellers, statusFilter, searchQuery])

  const handleApprove = async () => {
    if (!selectedReseller) return
    setIsProcessing(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('resellers')
      .update({ status: 'active' })
      .eq('id', selectedReseller.id)

    if (!error) {
      setResellers(prev =>
        prev.map(r =>
          r.id === selectedReseller.id ? { ...r, status: 'active' as const } : r
        )
      )
    }

    setIsProcessing(false)
    setDialogType(null)
    setSelectedReseller(null)
  }

  const handleSuspend = async () => {
    if (!selectedReseller) return
    setIsProcessing(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('resellers')
      .update({ status: 'suspended' })
      .eq('id', selectedReseller.id)

    if (!error) {
      setResellers(prev =>
        prev.map(r =>
          r.id === selectedReseller.id ? { ...r, status: 'suspended' as const } : r
        )
      )
    }

    setIsProcessing(false)
    setDialogType(null)
    setSelectedReseller(null)
  }

  const handleReactivate = async () => {
    if (!selectedReseller) return
    setIsProcessing(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('resellers')
      .update({ status: 'active' })
      .eq('id', selectedReseller.id)

    if (!error) {
      setResellers(prev =>
        prev.map(r =>
          r.id === selectedReseller.id ? { ...r, status: 'active' as const } : r
        )
      )
    }

    setIsProcessing(false)
    setDialogType(null)
    setSelectedReseller(null)
  }

  const handleUpdateCommission = async () => {
    if (!selectedReseller || !newCommissionRate) return
    setIsProcessing(true)

    const rate = parseFloat(newCommissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setIsProcessing(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('resellers')
      .update({ commission_rate: rate })
      .eq('id', selectedReseller.id)

    if (!error) {
      setResellers(prev =>
        prev.map(r =>
          r.id === selectedReseller.id ? { ...r, commission_rate: rate } : r
        )
      )
    }

    setIsProcessing(false)
    setDialogType(null)
    setSelectedReseller(null)
    setNewCommissionRate('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Actif</Badge>
      case 'suspended':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Suspendu</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des revendeurs</h1>
          <p className="text-muted-foreground">Validez et gerez les comptes revendeurs</p>
        </div>
        <Button variant="outline" onClick={fetchResellers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, contact ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'active', 'suspended'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' && 'Tous'}
                  {status === 'pending' && 'En attente'}
                  {status === 'active' && 'Actifs'}
                  {status === 'suspended' && 'Suspendus'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resellers list */}
      <div className="grid gap-4">
        {filteredResellers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun revendeur trouve
            </CardContent>
          </Card>
        ) : (
          filteredResellers.map((reseller) => (
            <Card key={reseller.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{reseller.company_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{reseller.contact_name}</p>
                    </div>
                  </div>
                  {getStatusBadge(reseller.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {reseller.email}
                  </div>
                  {reseller.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {reseller.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    Commission: {reseller.commission_rate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reseller.licenses_count} licence{reseller.licenses_count > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {reseller.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedReseller(reseller)
                        setDialogType('approve')
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                  )}
                  {reseller.status === 'active' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedReseller(reseller)
                        setDialogType('suspend')
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Suspendre
                    </Button>
                  )}
                  {reseller.status === 'suspended' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReseller(reseller)
                        setDialogType('reactivate')
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Reactiver
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReseller(reseller)
                      setNewCommissionRate(reseller.commission_rate.toString())
                      setDialogType('commission')
                    }}
                  >
                    <Percent className="w-4 h-4 mr-1" />
                    Modifier commission
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={dialogType === 'approve'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le revendeur</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir approuver {selectedReseller?.company_name} comme revendeur ?
              Ils pourront creer et gerer des licences.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approbation...' : 'Approuver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={dialogType === 'suspend'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre le revendeur</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir suspendre {selectedReseller?.company_name} ?
              Ils ne pourront plus creer de nouvelles licences mais les licences existantes resteront actives.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isProcessing}>
              {isProcessing ? 'Suspension...' : 'Suspendre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={dialogType === 'reactivate'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactiver le revendeur</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir reactiver {selectedReseller?.company_name} ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Annuler
            </Button>
            <Button onClick={handleReactivate} disabled={isProcessing}>
              {isProcessing ? 'Reactivation...' : 'Reactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Dialog */}
      <Dialog open={dialogType === 'commission'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le taux de commission</DialogTitle>
            <DialogDescription>
              Definissez le nouveau taux de commission pour {selectedReseller?.company_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="commission">Taux de commission (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={newCommissionRate}
              onChange={(e) => setNewCommissionRate(e.target.value)}
              placeholder="20"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCommission} disabled={isProcessing}>
              {isProcessing ? 'Mise a jour...' : 'Mettre a jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
