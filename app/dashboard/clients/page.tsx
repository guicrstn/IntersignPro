import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Users, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/lib/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user!.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Gerez vos clients et leurs informations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
      </div>

      {/* Clients Grid */}
      {clients && clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: Client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {client.address}
                      {client.postal_code && `, ${client.postal_code}`}
                      {client.city && ` ${client.city}`}
                    </span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun client</h3>
            <p className="text-muted-foreground mt-1 text-center">
              Commencez par ajouter votre premier client pour creer des interventions.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/clients/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter mon premier client
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
