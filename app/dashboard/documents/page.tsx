import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PlusCircle, 
  FileText, 
  ShoppingCart, 
  Truck, 
  Receipt,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import type { DocumentType, DocumentStatus, DocumentWithClient } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/types'

const documentTypeIcons: Record<DocumentType, React.ReactNode> = {
  devis: <FileText className="h-4 w-4" />,
  commande: <ShoppingCart className="h-4 w-4" />,
  livraison: <Truck className="h-4 w-4" />,
  facture: <Receipt className="h-4 w-4" />,
}

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  signed: 'bg-green-100 text-green-700',
  converted: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get stats
  const { data: stats } = await supabase
    .from('documents')
    .select('document_type, status')
    .eq('user_id', user!.id)

  const devisCount = stats?.filter(d => d.document_type === 'devis').length || 0
  const commandeCount = stats?.filter(d => d.document_type === 'commande').length || 0
  const livraisonCount = stats?.filter(d => d.document_type === 'livraison').length || 0
  const factureCount = stats?.filter(d => d.document_type === 'facture').length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Gerez vos devis, commandes, livraisons et factures</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/documents/new?type=devis">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devisCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commandeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Livraisons</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{livraisonCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Factures</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factureCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/documents/new?type=devis">
            <FileText className="mr-2 h-4 w-4" />
            Nouveau devis
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/documents/new?type=facture">
            <Receipt className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Link>
        </Button>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Tous les documents</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {(documents as DocumentWithClient[]).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {documentTypeIcons[doc.document_type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{doc.document_number}</p>
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPE_LABELS[doc.document_type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.client?.name} - {new Date(doc.document_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[doc.status]}>
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Aucun document</p>
              <p className="text-sm">Commencez par creer un devis</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/documents/new?type=devis">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Creer un devis
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
