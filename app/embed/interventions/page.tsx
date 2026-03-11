'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ClipboardList, Plus, Calendar, User } from 'lucide-react'
import Link from 'next/link'

interface Intervention {
  id: string
  intervention_number: string
  description: string
  date: string
  status: string
  client: {
    name: string
  }
}

export default function EmbedInterventionsPage() {
  const searchParams = useSearchParams()
  const apiKey = searchParams.get('api_key')
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInterventions = async () => {
      if (!apiKey) {
        setError('Cle API manquante')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/v1/interventions', {
          headers: {
            'X-API-Key': apiKey,
          },
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la recuperation des interventions')
        }

        const data = await response.json()
        setInterventions(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInterventions()
  }, [apiKey])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">Signee</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      default:
        return <Badge variant="secondary">Brouillon</Badge>
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Interventions</h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/embed/interventions/new?api_key=${apiKey}`}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Link>
        </Button>
      </div>

      {interventions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune intervention
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention) => (
            <Link
              key={intervention.id}
              href={`/embed/interventions/${intervention.id}?api_key=${apiKey}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {intervention.intervention_number}
                    </CardTitle>
                    {getStatusBadge(intervention.status)}
                  </div>
                </CardHeader>
                <CardContent className="py-2 pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {intervention.client?.name || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(intervention.date).toLocaleDateString('fr-FR')}
                    </span>
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
