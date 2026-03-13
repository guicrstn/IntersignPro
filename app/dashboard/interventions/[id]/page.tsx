import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, User, FileText, PenTool, Check, Download } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Company } from '@/lib/types'
import { HourDeductionButton } from '@/components/hour-deduction'
import { InterventionDeleteButton } from '@/components/intervention-delete-button'

export default async function InterventionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: intervention } = await supabase
    .from('interventions')
    .select('*, client:clients(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!intervention) {
    notFound()
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/interventions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {intervention.intervention_number}
              </h1>
              <span className={`text-xs px-2 py-1 rounded-full ${
                intervention.status === 'signed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {intervention.status === 'signed' ? 'Signee' : 'Brouillon'}
              </span>
            </div>
            <p className="text-muted-foreground">Bon d&apos;intervention</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Hour Deduction Button */}
          {intervention.client_id && (
            <HourDeductionButton
              interventionId={id}
              clientId={intervention.client_id}
              interventionNumber={intervention.intervention_number}
            />
          )}
          
          {/* Delete Button */}
          <InterventionDeleteButton
            interventionId={id}
            interventionNumber={intervention.intervention_number}
          />
          
          {intervention.status === 'draft' && (
            <Button asChild>
              <Link href={`/dashboard/interventions/${id}/sign`}>
                <PenTool className="mr-2 h-4 w-4" />
                Faire signer
              </Link>
            </Button>
          )}
          {intervention.status === 'signed' && (
            <Button asChild>
              <Link href={`/dashboard/interventions/${id}/pdf`}>
                <Download className="mr-2 h-4 w-4" />
                Telecharger PDF
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Intervention Preview Card */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6 md:p-8">
          {/* Header with Company Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-primary">{company?.name || 'Ma Societe'}</h2>
              {company?.address && (
                <p className="text-sm text-muted-foreground mt-1">
                  {company.address}
                  {company.postal_code && `, ${company.postal_code}`}
                  {company.city && ` ${company.city}`}
                </p>
              )}
              {company?.phone && (
                <p className="text-sm text-muted-foreground">Tel: {company.phone}</p>
              )}
              {company?.email && (
                <p className="text-sm text-muted-foreground">{company.email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{intervention.intervention_number}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                <Calendar className="h-4 w-4" />
                {new Date(intervention.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="py-6 border-b">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Client
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{intervention.client?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {intervention.client?.address}
                {intervention.client?.postal_code && `, ${intervention.client?.postal_code}`}
                {intervention.client?.city && ` ${intervention.client?.city}`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="py-6 border-b">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Description de l&apos;intervention
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap text-sm">{intervention.description}</p>
            </div>
          </div>

          {/* Signature */}
          <div className="pt-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <PenTool className="h-4 w-4" />
              Signature du client
            </h3>
            {intervention.status === 'signed' && intervention.signature_data ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="border rounded bg-white p-2 inline-block">
                  <Image
                    src={intervention.signature_data}
                    alt="Signature du client"
                    width={300}
                    height={150}
                    className="max-w-full h-auto"
                  />
                </div>
                {intervention.signer_name && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Signe par : {intervention.signer_name}
                  </p>
                )}
                {intervention.signed_at && (
                  <p className="text-sm text-muted-foreground">
                    Le : {new Date(intervention.signed_at).toLocaleString('fr-FR')}
                  </p>
                )}
                <div className="flex items-center gap-1 text-green-600 mt-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Intervention validee</span>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <PenTool className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">En attente de signature</p>
                <Button asChild className="mt-4">
                  <Link href={`/dashboard/interventions/${id}/sign`}>
                    Faire signer maintenant
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
