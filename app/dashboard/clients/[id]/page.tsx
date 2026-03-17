import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Phone, Mail, ClipboardList, PlusCircle, Pencil, User, Building2, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Intervention } from '@/lib/types'
import { ClientDeleteButton } from '@/components/client-delete-button'
import { HourContracts } from '@/components/hour-contracts'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!client) {
    notFound()
  }

  // Get interventions for this client
  const { data: interventions } = await supabase
    .from('interventions')
    .select('*')
    .eq('client_id', id)
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <Badge variant={client.client_type === 'professionnel' ? 'default' : 'secondary'}>
                {client.client_type === 'professionnel' ? (
                  <><Building2 className="h-3 w-3 mr-1" /> Professionnel</>
                ) : (
                  <><User className="h-3 w-3 mr-1" /> Particulier</>
                )}
              </Badge>
            </div>
            <p className="text-muted-foreground">Fiche client</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/clients/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <ClientDeleteButton clientId={id} clientName={client.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Coordonnees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">
                  {client.address}
                  {client.postal_code && <br />}
                  {client.postal_code} {client.city}
                </p>
              </div>
            </div>

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Telephone</p>
                  <p className="text-muted-foreground">{client.phone}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{client.email}</p>
                </div>
              </div>
            )}

            {/* Professional info - SIRET and TVA */}
            {client.client_type === 'professionnel' && (client.siret || client.tva_number) && (
              <div className="pt-4 border-t">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations professionnelles
                </p>
                <div className="space-y-2 text-sm">
                  {client.siret && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SIRET</span>
                      <span className="font-mono">{client.siret}</span>
                    </div>
                  )}
                  {client.tva_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N° TVA</span>
                      <span className="font-mono">{client.tva_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {client.notes && (
              <div className="pt-4 border-t">
                <p className="font-medium mb-1">Notes</p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interventions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Interventions</CardTitle>
            <Button asChild size="sm">
              <Link href={`/dashboard/interventions/new?client=${id}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {interventions && interventions.length > 0 ? (
              <ul className="space-y-3">
                {interventions.map((intervention: Intervention) => (
                  <li key={intervention.id}>
                    <Link
                      href={`/dashboard/interventions/${intervention.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{intervention.intervention_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(intervention.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
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
                <p>Aucune intervention pour ce client</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hour Contracts */}
        <HourContracts clientId={id} clientName={client.name} />
      </div>
    </div>
  )
}
