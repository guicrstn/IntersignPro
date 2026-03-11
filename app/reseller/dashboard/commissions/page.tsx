'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Euro,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import type { License } from '@/lib/types'

interface MonthlyCommission {
  month: string
  licenses: number
  revenue: number
}

export default function CommissionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState(20)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyCommission[]>([])
  const [licenses, setLicenses] = useState<License[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: resellerData } = await supabase
        .from('resellers')
        .select('id, commission_rate')
        .eq('user_id', user.id)
        .single()

      if (!resellerData) return

      setCommissionRate(resellerData.commission_rate)

      const { data: licensesData } = await supabase
        .from('licenses')
        .select('*')
        .eq('reseller_id', resellerData.id)
        .order('created_at', { ascending: false })

      if (licensesData) {
        setLicenses(licensesData)

        const planPrices = { monthly: 29, annual: 290, lifetime: 590 }
        
        // Calculate total revenue
        const total = licensesData.reduce((sum, l) => {
          const price = planPrices[l.plan as keyof typeof planPrices] || 0
          return sum + (price * resellerData.commission_rate / 100)
        }, 0)
        setTotalRevenue(total)

        // Group by month
        const monthlyMap = new Map<string, { licenses: number; revenue: number }>()
        
        licensesData.forEach(license => {
          const date = new Date(license.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const price = planPrices[license.plan as keyof typeof planPrices] || 0
          const commission = price * resellerData.commission_rate / 100

          const current = monthlyMap.get(monthKey) || { licenses: 0, revenue: 0 }
          monthlyMap.set(monthKey, {
            licenses: current.licenses + 1,
            revenue: current.revenue + commission,
          })
        })

        // Convert to array and sort
        const monthly = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => b.month.localeCompare(a.month))

        setMonthlyData(monthly)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const getCurrentMonthRevenue = () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const data = monthlyData.find(m => m.month === currentMonth)
    return data?.revenue || 0
  }

  const getLastMonthRevenue = () => {
    const now = new Date()
    now.setMonth(now.getMonth() - 1)
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const data = monthlyData.find(m => m.month === lastMonth)
    return data?.revenue || 0
  }

  const getGrowth = () => {
    const current = getCurrentMonthRevenue()
    const last = getLastMonthRevenue()
    if (last === 0) return current > 0 ? 100 : 0
    return ((current - last) / last) * 100
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const growth = getGrowth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
        <p className="text-muted-foreground">
          Suivez vos revenus et commissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total commissions
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground mt-1">
              depuis le debut
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ce mois-ci
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCurrentMonthRevenue().toFixed(0)}€</div>
            <div className="flex items-center text-xs mt-1">
              {growth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(growth).toFixed(0)}%
              </span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de commission
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              sur chaque vente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total licences
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              licences vendues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Historique mensuel</CardTitle>
          <CardDescription>
            Vos commissions mois par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune commission pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {monthlyData.map((month) => (
                <div 
                  key={month.month}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{formatMonth(month.month)}</p>
                    <p className="text-sm text-muted-foreground">
                      {month.licenses} licence{month.licenses > 1 ? 's' : ''} vendue{month.licenses > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{month.revenue.toFixed(0)}€</p>
                    <Badge variant="outline">{commissionRate}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sales */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes recentes</CardTitle>
          <CardDescription>
            Vos 10 dernieres ventes avec commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune vente pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {licenses.slice(0, 10).map((license) => {
                const planPrices = { monthly: 29, annual: 290, lifetime: 590 }
                const price = planPrices[license.plan as keyof typeof planPrices] || 0
                const commission = price * commissionRate / 100

                return (
                  <div 
                    key={license.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{license.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(license.created_at).toLocaleDateString('fr-FR')} - Plan {license.plan}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+{commission.toFixed(0)}€</p>
                      <p className="text-xs text-muted-foreground">sur {price}€</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
