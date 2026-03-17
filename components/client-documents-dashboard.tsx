'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  ShoppingCart,
  Truck,
  Receipt,
  ClipboardList,
  PlusCircle,
  Eye,
  PenTool,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  type Document,
  type Intervention,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '@/lib/types'

interface ClientDocumentsDashboardProps {
  clientId: string
  clientName: string
}

export function ClientDocumentsDashboard({ clientId, clientName }: ClientDocumentsDashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Fetch documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      // Fetch interventions
      const { data: ints } = await supabase
        .from('interventions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      setDocuments(docs || [])
      setInterventions(ints || [])
      setIsLoading(false)
    }

    fetchData()
  }, [clientId])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      sent: 'outline',
      signed: 'default',
      converted: 'default',
      cancelled: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS] || status}
      </Badge>
    )
  }

  const getInterventionStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      draft: 'secondary',
      signed: 'default',
      sent: 'outline',
    }
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      signed: 'Signe',
      sent: 'Envoye',
    }
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
  }

  const filterDocumentsByType = (type: string) => {
    return documents.filter(d => d.document_type === type)
  }

  const devis = filterDocumentsByType('devis')
  const commandes = filterDocumentsByType('commande')
  const livraisons = filterDocumentsByType('livraison')
  const factures = filterDocumentsByType('facture')

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement des documents...</p>
        </CardContent>
      </Card>
    )
  }

  const DocumentTable = ({ docs, type }: { docs: Document[]; type: string }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {docs.length} {type}(s)
        </p>
        <Button size="sm" asChild>
          <Link href={`/dashboard/documents/new?client=${clientId}&type=${type}`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau
          </Link>
        </Button>
      </div>
      {docs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Aucun {type}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.document_number}</TableCell>
                <TableCell>
                  {new Date(doc.document_date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {doc.status === 'draft' && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/documents/${doc.id}/sign`}>
                          <PenTool className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents et interventions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="devis" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="devis" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Devis</span>
              {devis.length > 0 && (
                <Badge variant="secondary" className="ml-1">{devis.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="commandes" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes</span>
              {commandes.length > 0 && (
                <Badge variant="secondary" className="ml-1">{commandes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="livraisons" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Livraisons</span>
              {livraisons.length > 0 && (
                <Badge variant="secondary" className="ml-1">{livraisons.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="factures" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Factures</span>
              {factures.length > 0 && (
                <Badge variant="secondary" className="ml-1">{factures.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="interventions" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Interventions</span>
              {interventions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{interventions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devis" className="mt-6">
            <DocumentTable docs={devis} type="devis" />
          </TabsContent>

          <TabsContent value="commandes" className="mt-6">
            <DocumentTable docs={commandes} type="commande" />
          </TabsContent>

          <TabsContent value="livraisons" className="mt-6">
            <DocumentTable docs={livraisons} type="livraison" />
          </TabsContent>

          <TabsContent value="factures" className="mt-6">
            <DocumentTable docs={factures} type="facture" />
          </TabsContent>

          <TabsContent value="interventions" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {interventions.length} intervention(s)
                </p>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/interventions/new?client=${clientId}`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvelle
                  </Link>
                </Button>
              </div>
              {interventions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune intervention</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interventions.map((int) => (
                      <TableRow key={int.id}>
                        <TableCell className="font-medium">{int.intervention_number}</TableCell>
                        <TableCell>
                          {new Date(int.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{getInterventionStatusBadge(int.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/interventions/${int.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
