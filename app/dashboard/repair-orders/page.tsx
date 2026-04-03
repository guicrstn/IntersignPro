import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Wrench, Clock, User, ChevronRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
  converted: 'Converti',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
}

export default async function RepairOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get repair orders with client info and task count
  const { data: repairOrders } = await supabase
    .from('repair_orders')
    .select(`
      *,
      clients (id, name),
      repair_order_tasks (id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordres de Reparation</h1>
          <p className="text-muted-foreground">
            Gerez vos OR et suivez le temps passe par intervenant
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/repair-orders/intervenants">
              <User className="mr-2 h-4 w-4" />
              Intervenants
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/repair-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel OR
            </Link>
          </Button>
        </div>
      </div>

      {!repairOrders || repairOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun ordre de reparation</h3>
            <p className="text-muted-foreground text-center mb-4">
              Creez votre premier OR pour suivre vos travaux et le temps passe.
            </p>
            <Button asChild>
              <Link href="/dashboard/repair-orders/new">
                <Plus className="mr-2 h-4 w-4" />
                Creer un OR
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {repairOrders.map((or) => (
            <Link key={or.id} href={`/dashboard/repair-orders/${or.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{or.or_number}</span>
                          <Badge className={statusColors[or.status] || statusColors.draft}>
                            {statusLabels[or.status] || or.status}
                          </Badge>
                          <Badge variant="outline" className={priorityColors[or.priority] || priorityColors.normal}>
                            {priorityLabels[or.priority] || or.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{or.clients?.name || 'Sans client'}</span>
                          {or.title && <span>- {or.title}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {or.repair_order_tasks?.length || 0} tache(s)
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(or.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
