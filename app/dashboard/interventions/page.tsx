import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, ClipboardList, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import type { InterventionWithClient } from '@/lib/types'

export default async function InterventionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: interventions } = await supabase
    .from('interventions')
    .select('*, client:clients(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interventions</h1>
          <p className="text-muted-foreground">Gerez vos bons d&apos;intervention</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/interventions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle intervention
          </Link>
        </Button>
      </div>

      {/* Interventions List */}
      {interventions && interventions.length > 0 ? (
        <div className="flex flex-col gap-4">
          {interventions.map((intervention: InterventionWithClient) => (
            <Link key={intervention.id} href={`/dashboard/interventions/${intervention.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {intervention.intervention_number}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          intervention.status === 'signed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {intervention.status === 'signed' ? 'Signee' : 'Brouillon'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {intervention.client?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(intervention.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucune intervention</h3>
            <p className="text-muted-foreground mt-1 text-center">
              Creez votre premiere intervention pour commencer.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/interventions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Creer ma premiere intervention
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
