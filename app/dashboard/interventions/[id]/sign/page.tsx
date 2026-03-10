'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Calendar, MapPin, User, FileText } from 'lucide-react'
import Link from 'next/link'
import { SignaturePad } from '@/components/signature-pad'
import type { InterventionWithClient, Company } from '@/lib/types'

export default function SignInterventionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intervention, setIntervention] = useState<InterventionWithClient | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: interventionData } = await supabase
          .from('interventions')
          .select('*, client:clients(*)')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setIntervention(interventionData)
        setCompany(companyData)
      }
      setIsFetching(false)
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!signatureData) {
      setError('Veuillez signer le bon d\'intervention')
      setIsLoading(false)
      return
    }

    if (!signerName.trim()) {
      setError('Veuillez entrer le nom du signataire')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('interventions')
      .update({
        signature_data: signatureData,
        signer_name: signerName.trim(),
        signed_at: new Date().toISOString(),
        status: 'signed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    router.push(`/dashboard/interventions/${id}`)
    router.refresh()
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Intervention non trouvee</p>
      </div>
    )
  }

  if (intervention.status === 'signed') {
    router.push(`/dashboard/interventions/${id}`)
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/interventions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Signature</h1>
          <p className="text-muted-foreground">{intervention.intervention_number}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Intervention Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{company?.name || 'Ma Societe'}</CardTitle>
              <span className="text-sm font-medium text-primary">{intervention.intervention_number}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(intervention.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                Client
              </p>
              <p className="font-medium">{intervention.client?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {intervention.client?.address}
                {intervention.client?.city && `, ${intervention.client?.city}`}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" />
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">{intervention.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle>Signature du client</CardTitle>
            <CardDescription>
              Le client confirme avoir pris connaissance de l&apos;intervention realisee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="signerName">Nom du signataire *</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Prenom et Nom"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Signature *</Label>
                <SignaturePad onSignatureChange={setSignatureData} />
                <p className="text-xs text-muted-foreground">
                  Utilisez votre doigt ou un stylet pour signer
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !signatureData}>
                <Check className="mr-2 h-4 w-4" />
                {isLoading ? 'Validation...' : 'Valider et signer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
