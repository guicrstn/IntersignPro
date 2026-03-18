import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ClipboardList, Clock, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Client, Intervention } from '@/lib/types'
import { ActivityChart } from '@/components/activity-chart'
import { RevenueDashboard } from '@/components/revenue-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get stats
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: interventionCount } = await supabase
    .from('interventions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: draftCount } = await supabase
    .from('interventions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'draft')

  const { count: signedCount } = await supabase
    .from('interventions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'signed')

  // Get all interventions for the chart (last 12 months)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const { data: allInterventions } = await supabase
    .from('interventions')
    .select('id, date, status, intervention_number')
    .eq('user_id', user!.id)
    .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // Get recent interventions
  const { data: recentInterventions } = await supabase
    .from('interventions')
    .select('*, client:clients(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent clients
  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { name: 'Clients', value: clientCount || 0, icon: Users, href: '/dashboard/clients' },
    { name: 'Interventions', value: interventionCount || 0, icon: ClipboardList, href: '/dashboard/interventions' },
    { name: 'En attente', value: draftCount || 0, icon: Clock, color: 'text-amber-500' },
    { name: 'Signees', value: signedCount || 0, icon: CheckCircle, color: 'text-green-500' },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre activite</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/interventions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle intervention
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.href && (
                <Link 
                  href={stat.href} 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Voir tout
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Dashboard */}
      <RevenueDashboard />

      {/* Activity Chart */}
      <ActivityChart interventions={allInterventions || []} />

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Interventions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Interventions recentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/interventions">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInterventions && recentInterventions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {recentInterventions.map((intervention: Intervention & { client: Client }) => (
                  <li key={intervention.id}>
                    <Link 
                      href={`/dashboard/interventions/${intervention.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{intervention.intervention_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {intervention.client?.name}
                        </p>
                      </div>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        intervention.status === 'signed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {intervention.status === 'signed' ? 'Signee' : 'Brouillon'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="mx-auto h-8 w-8 mb-2" />
                <p>Aucune intervention</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/dashboard/interventions/new">Creer ma premiere intervention</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Derniers clients</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/clients">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentClients && recentClients.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {recentClients.map((client: Client) => (
                  <li key={client.id}>
                    <Link 
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{client.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.city || client.address}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2" />
                <p>Aucun client</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/dashboard/clients/new">Ajouter mon premier client</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
