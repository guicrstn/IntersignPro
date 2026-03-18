'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Euro,
  FileText,
  ShoppingCart,
  Receipt,
  CalendarDays,
  Calendar
} from 'lucide-react'

interface RevenueStats {
  // Current month
  monthlyRevenue: number
  monthlyDevis: { count: number; amount: number }
  monthlyCommandes: { count: number; amount: number }
  monthlyFactures: { count: number; amount: number }
  // Current year
  yearlyRevenue: number
  yearlyDevis: { count: number; amount: number }
  yearlyCommandes: { count: number; amount: number }
  yearlyFactures: { count: number; amount: number }
}

export function RevenueDashboard() {
  const [stats, setStats] = useState<RevenueStats>({
    monthlyRevenue: 0,
    monthlyDevis: { count: 0, amount: 0 },
    monthlyCommandes: { count: 0, amount: 0 },
    monthlyFactures: { count: 0, amount: 0 },
    yearlyRevenue: 0,
    yearlyDevis: { count: 0, amount: 0 },
    yearlyCommandes: { count: 0, amount: 0 },
    yearlyFactures: { count: 0, amount: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      // Get all signed/converted documents with totals
      const { data: documents } = await supabase
        .from('documents')
        .select(`
          id,
          document_type,
          status,
          document_date,
          document_totals (total_ttc)
        `)
        .eq('user_id', user.id)
        .in('status', ['signed', 'converted'])
        .gte('document_date', startOfYear)
        .lte('document_date', endDate)

      // Calculate stats
      let monthlyDevis = { count: 0, amount: 0 }
      let monthlyCommandes = { count: 0, amount: 0 }
      let monthlyFactures = { count: 0, amount: 0 }
      let yearlyDevis = { count: 0, amount: 0 }
      let yearlyCommandes = { count: 0, amount: 0 }
      let yearlyFactures = { count: 0, amount: 0 }

      documents?.forEach(doc => {
        const total = doc.document_totals?.[0]?.total_ttc || 0
        const docDate = doc.document_date
        const isCurrentMonth = docDate >= startOfMonth

        // Yearly stats
        if (doc.document_type === 'devis') {
          yearlyDevis.count++
          yearlyDevis.amount += total
          if (isCurrentMonth) {
            monthlyDevis.count++
            monthlyDevis.amount += total
          }
        }
        if (doc.document_type === 'commande') {
          yearlyCommandes.count++
          yearlyCommandes.amount += total
          if (isCurrentMonth) {
            monthlyCommandes.count++
            monthlyCommandes.amount += total
          }
        }
        if (doc.document_type === 'facture') {
          yearlyFactures.count++
          yearlyFactures.amount += total
          if (isCurrentMonth) {
            monthlyFactures.count++
            monthlyFactures.amount += total
          }
        }
      })

      // Revenue is based on factures only (to avoid double counting)
      setStats({
        monthlyRevenue: monthlyFactures.amount,
        monthlyDevis,
        monthlyCommandes,
        monthlyFactures,
        yearlyRevenue: yearlyFactures.amount,
        yearlyDevis,
        yearlyCommandes,
        yearlyFactures,
      })
      setIsLoading(false)
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const currentYear = new Date().getFullYear()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Chiffre d'affaires - {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Base sur les factures signees du mois
            </p>
          </CardContent>
        </Card>

        {/* Yearly Revenue */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Chiffre d'affaires - {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.yearlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Base sur les factures signees de l'annee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detail des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Ce mois ({currentMonth})
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Devis signes</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stats.monthlyDevis.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.monthlyDevis.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Commandes validees</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stats.monthlyCommandes.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.monthlyCommandes.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Factures signees</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{stats.monthlyFactures.count}</p>
                    <p className="text-xs text-primary">{formatCurrency(stats.monthlyFactures.amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yearly Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Cette annee ({currentYear})
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Devis signes</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stats.yearlyDevis.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.yearlyDevis.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Commandes validees</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stats.yearlyCommandes.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.yearlyCommandes.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Factures signees</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{stats.yearlyFactures.count}</p>
                    <p className="text-xs text-green-600">{formatCurrency(stats.yearlyFactures.amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6 pt-4 border-t">
            Le chiffre d'affaires est calcule uniquement sur les factures signees pour eviter les doublons 
            (un devis converti en commande puis en facture n'est compte qu'une fois).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
