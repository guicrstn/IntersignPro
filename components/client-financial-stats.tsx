'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Package, 
  Wrench, 
  Euro,
  FileText,
  ShoppingCart,
  Receipt
} from 'lucide-react'

interface ClientFinancialStatsProps {
  clientId: string
}

interface Stats {
  totalMateriel: number
  totalPrestation: number
  totalGeneral: number
  devisSigned: number
  devisSignedAmount: number
  commandesValidated: number
  commandesAmount: number
  facturesSigned: number
  facturesAmount: number
}

export function ClientFinancialStats({ clientId }: ClientFinancialStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalMateriel: 0,
    totalPrestation: 0,
    totalGeneral: 0,
    devisSigned: 0,
    devisSignedAmount: 0,
    commandesValidated: 0,
    commandesAmount: 0,
    facturesSigned: 0,
    facturesAmount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      // Get all documents for this client
      const { data: documents } = await supabase
        .from('documents')
        .select('id, document_type, status')
        .eq('client_id', clientId)

      // Get totals for all documents
      const allDocIds = documents?.map(d => d.id) || []
      const { data: allTotals } = await supabase
        .from('document_totals')
        .select('document_id, total_ttc')
        .in('document_id', allDocIds)

      // Create a map of document_id -> total_ttc
      const totalsMap: Record<string, number> = {}
      allTotals?.forEach(t => {
        totalsMap[t.document_id] = t.total_ttc || 0
      })

      // Get document lines to calculate materiel vs prestation
      const { data: documentIds } = await supabase
        .from('documents')
        .select('id')
        .eq('client_id', clientId)
        .in('status', ['signed', 'converted'])

      let totalMateriel = 0
      let totalPrestation = 0

      if (documentIds && documentIds.length > 0) {
        const ids = documentIds.map(d => d.id)
        
        // Get lines for signed/converted documents (only factures to avoid double counting)
        const { data: lines } = await supabase
          .from('document_lines')
          .select(`
            line_type,
            total_ttc,
            document_id
          `)
          .in('document_id', ids)

        // Get only facture documents
        const { data: factures } = await supabase
          .from('documents')
          .select('id')
          .eq('client_id', clientId)
          .eq('document_type', 'facture')
          .in('status', ['signed', 'converted'])

        const factureIds = factures?.map(f => f.id) || []

        lines?.forEach(line => {
          // Only count lines from factures to avoid double counting
          if (factureIds.includes(line.document_id)) {
            if (line.line_type === 'product') {
              totalMateriel += line.total_ttc || 0
            } else {
              totalPrestation += line.total_ttc || 0
            }
          }
        })
      }

      // Calculate stats by document type
      let devisSigned = 0
      let devisSignedAmount = 0
      let commandesValidated = 0
      let commandesAmount = 0
      let facturesSigned = 0
      let facturesAmount = 0

      documents?.forEach(doc => {
        const total = totalsMap[doc.id] || 0

        if (doc.document_type === 'devis' && (doc.status === 'signed' || doc.status === 'converted')) {
          devisSigned++
          devisSignedAmount += total
        }
        if (doc.document_type === 'commande' && (doc.status === 'signed' || doc.status === 'converted')) {
          commandesValidated++
          commandesAmount += total
        }
        if (doc.document_type === 'facture' && (doc.status === 'signed' || doc.status === 'converted')) {
          facturesSigned++
          facturesAmount += total
        }
      })

      setStats({
        totalMateriel,
        totalPrestation,
        totalGeneral: totalMateriel + totalPrestation,
        devisSigned,
        devisSignedAmount,
        commandesValidated,
        commandesAmount,
        facturesSigned,
        facturesAmount,
      })
      setIsLoading(false)
    }

    fetchStats()
  }, [clientId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Statistiques financieres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total General - Chiffre d'affaires client */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CA Total Client</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalGeneral)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materiel */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Materiel</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalMateriel)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prestations */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Wrench className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prestations</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalPrestation)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factures signees */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Factures signees</p>
                  <p className="text-xl font-bold">{stats.facturesSigned}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(stats.facturesAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document breakdown */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-4">Detail par type de document</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Devis signes</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{stats.devisSigned}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.devisSignedAmount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Commandes validees</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{stats.commandesValidated}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.commandesAmount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Factures signees</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{stats.facturesSigned}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.facturesAmount)}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Le CA total est calcule uniquement sur les factures signees pour eviter les doublons.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
