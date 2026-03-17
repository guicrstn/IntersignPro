'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight,
  FileText, 
  ShoppingCart, 
  Truck, 
  Receipt,
  FolderOpen,
  Folder,
  User,
  CheckCircle2,
  Circle
} from 'lucide-react'
import type { DocumentFolder } from '@/app/dashboard/documents/page'
import type { DocumentType, DocumentStatus } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

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

interface DocumentFolderListProps {
  folders: DocumentFolder[]
}

export function DocumentFolderList({ folders }: DocumentFolderListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  return (
    <div className="space-y-3">
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id)
        
        return (
          <div
            key={folder.id}
            className="rounded-lg border bg-card overflow-hidden"
          >
            {/* Folder Header */}
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isExpanded ? (
                    <FolderOpen className="h-6 w-6" />
                  ) : (
                    <Folder className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">Dossier {folder.folderNumber}</p>
                    <Badge variant="outline" className="text-xs">
                      {folder.documents.length} document{folder.documents.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{folder.clientName}</span>
                    <span>-</span>
                    <span>{new Date(folder.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Document type indicators */}
                <div className="hidden sm:flex items-center gap-1">
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full",
                    folder.hasDevis ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                  )}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full",
                    folder.hasCommande ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"
                  )}>
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full",
                    folder.hasLivraison ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-400"
                  )}>
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full",
                    folder.hasFacture ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  )}>
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                </div>
                
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Folder Contents - Expanded */}
            {isExpanded && (
              <div className="border-t bg-muted/30 px-4 py-3">
                <div className="space-y-2">
                  {folder.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/dashboard/documents/${doc.id}`}
                      className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          doc.document_type === 'devis' && "bg-blue-100 text-blue-700",
                          doc.document_type === 'commande' && "bg-orange-100 text-orange-700",
                          doc.document_type === 'livraison' && "bg-cyan-100 text-cyan-700",
                          doc.document_type === 'facture' && "bg-green-100 text-green-700",
                        )}>
                          {documentTypeIcons[doc.document_type]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{doc.document_number}</p>
                            <Badge variant="outline" className="text-xs">
                              {DOCUMENT_TYPE_LABELS[doc.document_type]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.document_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", statusColors[doc.status])}>
                        {DOCUMENT_STATUS_LABELS[doc.status]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
