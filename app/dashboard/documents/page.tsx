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
  Search,
  FolderOpen,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import type { DocumentType, DocumentStatus, DocumentWithClient } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/types'
import { DocumentFolderList } from '@/components/document-folder-list'

const documentTypeIcons: Record<DocumentType, React.ReactNode> = {
  devis: <FileText className="h-4 w-4" />,
  commande: <ShoppingCart className="h-4 w-4" />,
  livraison: <Truck className="h-4 w-4" />,
  facture: <Receipt className="h-4 w-4" />,
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

  // Get stats
  const { data: stats } = await supabase
    .from('documents')
    .select('document_type, status')
    .eq('user_id', user!.id)

  const devisCount = stats?.filter(d => d.document_type === 'devis').length || 0
  const commandeCount = stats?.filter(d => d.document_type === 'commande').length || 0
  const livraisonCount = stats?.filter(d => d.document_type === 'livraison').length || 0
  const factureCount = stats?.filter(d => d.document_type === 'facture').length || 0

  // Group documents into folders (chains of related documents)
  const documentFolders = groupDocumentsIntoFolders(documents as DocumentWithClient[] || [])

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

      {/* Documents List - Grouped by Folder */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Dossiers ({documentFolders.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {documentFolders.length > 0 ? (
            <DocumentFolderList folders={documentFolders} />
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

// Types for document folders
export interface DocumentFolder {
  id: string // Root document ID or folder number
  folderNumber: string // e.g., "0001"
  clientName: string
  clientId: string
  createdAt: string
  documents: DocumentWithClient[]
  latestStatus: DocumentStatus
  hasDevis: boolean
  hasCommande: boolean
  hasLivraison: boolean
  hasFacture: boolean
}

// Function to group documents into folders
function groupDocumentsIntoFolders(documents: DocumentWithClient[]): DocumentFolder[] {
  const folders: Map<string, DocumentFolder> = new Map()
  
  // Build a map of document ID to document
  const docMap = new Map<string, DocumentWithClient>()
  documents.forEach(doc => docMap.set(doc.id, doc))
  
  // Find root document for each document (follow parent_document_id chain)
  function findRootDocumentId(doc: DocumentWithClient): string {
    if (!doc.parent_document_id) {
      return doc.id
    }
    const parent = docMap.get(doc.parent_document_id)
    if (parent) {
      return findRootDocumentId(parent)
    }
    return doc.id
  }
  
  // Group documents by root document
  documents.forEach(doc => {
    const rootId = findRootDocumentId(doc)
    const rootDoc = docMap.get(rootId) || doc
    
    // Extract folder number from document number (e.g., "DEV-2026-0001" -> "0001")
    const folderNumber = rootDoc.document_number.split('-').pop() || rootDoc.id.slice(0, 4)
    
    if (!folders.has(rootId)) {
      folders.set(rootId, {
        id: rootId,
        folderNumber: folderNumber,
        clientName: rootDoc.client?.name || 'Client inconnu',
        clientId: rootDoc.client_id,
        createdAt: rootDoc.created_at,
        documents: [],
        latestStatus: 'draft',
        hasDevis: false,
        hasCommande: false,
        hasLivraison: false,
        hasFacture: false,
      })
    }
    
    const folder = folders.get(rootId)!
    folder.documents.push(doc)
    
    // Track document types
    if (doc.document_type === 'devis') folder.hasDevis = true
    if (doc.document_type === 'commande') folder.hasCommande = true
    if (doc.document_type === 'livraison') folder.hasLivraison = true
    if (doc.document_type === 'facture') folder.hasFacture = true
    
    // Update latest status based on document hierarchy
    if (doc.status === 'signed' && folder.latestStatus !== 'signed') {
      folder.latestStatus = 'signed'
    }
  })
  
  // Sort documents within each folder by type order
  const typeOrder: DocumentType[] = ['devis', 'commande', 'livraison', 'facture']
  folders.forEach(folder => {
    folder.documents.sort((a, b) => {
      return typeOrder.indexOf(a.document_type) - typeOrder.indexOf(b.document_type)
    })
  })
  
  // Return folders sorted by creation date (newest first)
  return Array.from(folders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
