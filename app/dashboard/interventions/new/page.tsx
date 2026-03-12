'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Users, PlusCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/lib/types'
import { QuoteImport, type QuoteLine } from '@/components/quote-import'

function NewInterventionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    client_id: preselectedClientId || '',
    description: '',
  })
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([])
  const [hasQuoteOption, setHasQuoteOption] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch clients
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        setClients(data || [])

        // Check if user has quote_import option
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (company) {
          const { data: license } = await supabase
            .from('licenses')
            .select('id, license_options(option_key)')
            .eq('company_id', company.id)
            .single()

          if (license?.license_options) {
            const hasOption = license.license_options.some(
              (opt: { option_key: string }) => opt.option_key === 'quote_import'
            )
            setHasQuoteOption(hasOption)
          }
        }
      }
      setIsFetching(false)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.client_id) {
      setError('Veuillez selectionner un client')
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Vous devez etre connecte')
      setIsLoading(false)
      return
    }

    // Generate intervention number
    const { data: numberData } = await supabase.rpc('generate_intervention_number', {
      p_user_id: user.id,
    })

    const interventionNumber = numberData || `INT-${new Date().getFullYear()}-0001`

    const { data: intervention, error: insertError } = await supabase
      .from('interventions')
      .insert({
        user_id: user.id,
        client_id: formData.client_id,
        intervention_number: interventionNumber,
        description: formData.description,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        quote_lines: quoteLines.length > 0 ? quoteLines : null,
        quote_imported_at: quoteLines.length > 0 ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push(`/dashboard/interventions/${intervention.id}`)
    router.refresh()
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/interventions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvelle intervention</h1>
          <p className="text-muted-foreground">Creez un nouveau bon d&apos;intervention</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun client</h3>
            <p className="text-muted-foreground mt-1 text-center">
              Vous devez d&apos;abord creer un client avant de pouvoir creer une intervention.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/clients/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un client
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Details de l&apos;intervention</CardTitle>
            <CardDescription>
              Selectionnez un client et decrivez l&apos;intervention realisee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Selectionnez un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.city || client.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description de l&apos;intervention *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Decrivez les travaux realises, le materiel utilise, les observations..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Soyez precis et detaille pour une meilleure tracabilite.
                  </p>
                </div>

                {/* Quote import section */}
                {hasQuoteOption && (
                  <div className="grid gap-2">
                    <Label>Import de devis (optionnel)</Label>
                    <div className="flex items-center gap-4">
                      <QuoteImport 
                        onImport={setQuoteLines}
                        existingLines={quoteLines}
                      />
                      {quoteLines.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {quoteLines.length} ligne{quoteLines.length > 1 ? 's' : ''} importee{quoteLines.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Importez un devis PDF pour extraire automatiquement les lignes et les faire signer.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Creation...' : 'Creer l\'intervention'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/interventions">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NewInterventionFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    </div>
  )
}

export default function NewInterventionPage() {
  return (
    <Suspense fallback={<NewInterventionFallback />}>
      <NewInterventionContent />
    </Suspense>
  )
}
