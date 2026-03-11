'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Key, CheckCircle, Clock } from 'lucide-react'

interface Stats {
  totalResellers: number
  pendingResellers: number
  activeResellers: number
  totalLicenses: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalResellers: 0,
    pendingResellers: 0,
    activeResellers: 0,
    totalLicenses: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      // Fetch resellers stats
      const { data: resellers } = await supabase
        .from('resellers')
        .select('status')

      const totalResellers = resellers?.length || 0
      const pendingResellers = resellers?.filter(r => r.status === 'pending').length || 0
      const activeResellers = resellers?.filter(r => r.status === 'active').length || 0

      // Fetch licenses count
      const { count: licensesCount } = await supabase
        .from('licenses')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalResellers,
        pendingResellers,
        activeResellers,
        totalLicenses: licensesCount || 0,
      })
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Administration</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble du systeme InterSign Pro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revendeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingResellers}</div>
            <p className="text-xs text-muted-foreground">Demandes a valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revendeurs actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeResellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Licences</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">Licences creees</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
