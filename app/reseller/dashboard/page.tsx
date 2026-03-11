'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { 
  KeyRound, 
  TrendingUp, 
  Users, 
  Euro,
  PlusCircle,
  ArrowRight,
} from 'lucide-react'
import type { License } from '@/lib/types'

interface DashboardStats {
  totalLicenses: number
  activeLicenses: number
  totalRevenue: number
  monthlyRevenue: number
}

export default function ResellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLicenses: 0,
    activeLicenses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  })
  const [recentLicenses, setRecentLicenses] = useState<License[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reseller, setReseller] = useState<{ id: string; commission_rate: number } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get reseller info
      const { data: resellerData } = await supabase
        .from('resellers')
        .select('id, commission_rate')
        .eq('user_id', user.id)
        .single()

      if (!resellerData) return

      setReseller(resellerData)

      // Get licenses
      const { data: licenses } = await supabase
        .from('licenses')
        .select('*')
        .eq('reseller_id', resellerData.id)
        .order('created_at', { ascending: false })

      if (licenses) {
        const activeLicenses = licenses.filter(l => l.status === 'active')
        
        // Calculate revenue based on plan prices and commission
        const planPrices = { monthly: 29, annual: 290, lifetime: 590 }
        const totalRevenue = licenses.reduce((sum, l) => {
          const price = planPrices[l.plan as keyof typeof planPrices] || 0
          return sum + (price * resellerData.commission_rate / 100)
        }, 0)

        // Monthly revenue (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const monthlyLicenses = licenses.filter(l => new Date(l.created_at) > thirtyDaysAgo)
        const monthlyRevenue = monthlyLicenses.reduce((sum, l) => {
          const price = planPrices[l.plan as keyof typeof planPrices] || 0
          return sum + (price * resellerData.commission_rate / 100)
        }, 0)

        setStats({
          totalLicenses: licenses.length,
          activeLicenses: activeLicenses.length,
          totalRevenue,
          monthlyRevenue,
        })

        setRecentLicenses(licenses.slice(0, 5))
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Gerez vos licences et suivez vos commissions
          </p>
        </div>
        <Button asChild>
          <Link href="/reseller/dashboard/licenses/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle licence
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total licences
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeLicenses} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commissions du mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reseller?.commission_rate}% de commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total commissions
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground mt-1">
              depuis le debut
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent licenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Licences recentes</CardTitle>
            <CardDescription>
              Les 5 dernieres licences creees
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reseller/dashboard/licenses">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLicenses.length === 0 ? (
            <div className="text-center py-8">
              <KeyRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune licence pour le moment</p>
              <Button asChild className="mt-4">
                <Link href="/reseller/dashboard/licenses/new">
                  Creer une licence
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLicenses.map((license) => (
                <div 
                  key={license.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{license.client_name}</span>
                      <Badge variant={license.status === 'active' ? 'default' : 'secondary'}>
                        {license.status === 'active' ? 'Active' : license.status === 'suspended' ? 'Suspendue' : 'Expiree'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{license.client_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium capitalize">{license.plan}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {license.license_key.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/reseller/dashboard/licenses/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlusCircle className="h-5 w-5 text-primary" />
                Nouvelle licence
              </CardTitle>
              <CardDescription>
                Creer une licence pour un nouveau client
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/reseller/dashboard/licenses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-5 w-5 text-primary" />
                Gerer les licences
              </CardTitle>
              <CardDescription>
                Voir et gerer toutes vos licences
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/reseller/dashboard/commissions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Mes commissions
              </CardTitle>
              <CardDescription>
                Suivre vos revenus et commissions
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
