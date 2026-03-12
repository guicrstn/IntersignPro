'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { 
  FileSignature, 
  Users, 
  ClipboardList, 
  PlusCircle,
  AlertTriangle,
} from 'lucide-react'

interface EmbedData {
  company: {
    name: string
    email: string
  }
  stats: {
    clients: number
    interventions: number
    signed: number
  }
  recentInterventions: {
    id: string
    intervention_number: string
    status: string
    date: string
    client: { name: string }
  }[]
}

function EmbedContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EmbedData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Token API manquant')
        setIsLoading(false)
        return
      }

      try {
        // Fetch company info
        const companyRes = await fetch('/api/v1/company', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        
        if (!companyRes.ok) {
          throw new Error('Token invalide ou expire')
        }
        
        const companyData = await companyRes.json()
        
        // Fetch clients count
        const clientsRes = await fetch('/api/v1/clients?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const clientsData = await clientsRes.json()
        
        // Fetch interventions
        const interventionsRes = await fetch('/api/v1/interventions?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const interventionsData = await interventionsRes.json()
        
        // Count signed
        const signedCount = interventionsData.data?.filter(
          (i: { status: string }) => i.status === 'signed'
        ).length || 0
        
        setData({
          company: companyData.data,
          stats: {
            clients: clientsData.pagination?.total || 0,
            interventions: interventionsData.pagination?.total || 0,
            signed: signedCount,
          },
          recentInterventions: interventionsData.data || [],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Erreur d&apos;authentification</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Verifiez que le token API est valide et non expire.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-lg">InterSign Pro</h1>
            <p className="text-sm text-muted-foreground">{data?.company.name}</p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href={`/embed/interventions/new?token=${token}`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.stats.clients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Interventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.stats.interventions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Signees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.stats.signed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Interventions recentes</CardTitle>
          <CardDescription>Les 5 dernieres interventions</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentInterventions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucune intervention
            </p>
          ) : (
            <div className="space-y-3">
              {data?.recentInterventions.map((intervention) => (
                <Link
                  key={intervention.id}
                  href={`/embed/interventions/${intervention.id}?token=${token}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{intervention.intervention_number}</span>
                      <Badge variant={intervention.status === 'signed' ? 'default' : 'secondary'}>
                        {intervention.status === 'signed' ? 'Signee' : 
                         intervention.status === 'draft' ? 'Brouillon' : intervention.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{intervention.client?.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(intervention.date).toLocaleDateString('fr-FR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link href={`/embed/clients?token=${token}`}>
            <Users className="h-5 w-5 mr-2" />
            Gerer les clients
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4" asChild>
          <Link href={`/embed/interventions?token=${token}`}>
            <ClipboardList className="h-5 w-5 mr-2" />
            Toutes les interventions
          </Link>
        </Button>
      </div>
    </div>
  )
}

function EmbedFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<EmbedFallback />}>
      <EmbedContent />
    </Suspense>
  )
}
