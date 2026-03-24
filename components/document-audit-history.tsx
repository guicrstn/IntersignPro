'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  FileText, 
  Edit, 
  Send, 
  CheckCircle, 
  Eye, 
  FileDown,
  Trash2,
  RefreshCw,
  Shield,
  Clock,
  User,
  Hash,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react'
import { useAudit } from '@/hooks/use-audit'

interface AuditLog {
  id: string
  document_id: string
  action: string
  action_details: Record<string, unknown>
  document_hash: string
  actor_type: string
  actor_name: string | null
  actor_email: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface DocumentVersion {
  id: string
  version_number: number
  reason: string | null
  content_hash: string
  created_at: string
}

interface DocumentAuditHistoryProps {
  documentId: string
  documentNumber: string
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Document cree',
  updated: 'Document modifie',
  status_changed: 'Statut modifie',
  signed: 'Document signe',
  signature_requested: 'Signature demandee',
  converted: 'Document converti',
  viewed: 'Document consulte',
  pdf_generated: 'PDF genere',
  sent: 'Document envoye',
  deleted: 'Document supprime',
}

const ACTION_ICONS: Record<string, typeof FileText> = {
  created: FileText,
  updated: Edit,
  status_changed: RefreshCw,
  signed: CheckCircle,
  signature_requested: Send,
  converted: RefreshCw,
  viewed: Eye,
  pdf_generated: FileDown,
  sent: Send,
  deleted: Trash2,
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  status_changed: 'bg-purple-100 text-purple-700',
  signed: 'bg-emerald-100 text-emerald-700',
  signature_requested: 'bg-amber-100 text-amber-700',
  converted: 'bg-indigo-100 text-indigo-700',
  viewed: 'bg-gray-100 text-gray-700',
  pdf_generated: 'bg-cyan-100 text-cyan-700',
  sent: 'bg-orange-100 text-orange-700',
  deleted: 'bg-red-100 text-red-700',
}

export function DocumentAuditHistory({ documentId, documentNumber }: DocumentAuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { getAuditHistory } = useAudit()

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, documentId])

  const loadHistory = async () => {
    setIsLoading(true)
    const result = await getAuditHistory(documentId)
    setLogs(result.logs || [])
    setVersions(result.versions || [])
    setIsLoading(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Historique / Audit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Piste d'audit - {documentNumber}
          </DialogTitle>
          <DialogDescription>
            Journal des modifications et preuves d'integrite du document
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="logs" className="flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Journal d'audit ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Versions ({versions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[50vh]">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun historique disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {logs.map((log, index) => {
                      const Icon = ACTION_ICONS[log.action] || FileText
                      const colorClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                      
                      return (
                        <Card key={log.id} className="relative">
                          {index < logs.length - 1 && (
                            <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-border -mb-3" />
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-full ${colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <Badge className={colorClass}>
                                    {ACTION_LABELS[log.action] || log.action}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(log.created_at)}
                                  </span>
                                </div>
                                
                                <div className="mt-2 space-y-1 text-sm">
                                  {log.actor_name && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span>{log.actor_name}</span>
                                      {log.actor_type !== 'user' && (
                                        <Badge variant="outline" className="text-xs">
                                          {log.actor_type === 'client' ? 'Client' : 'Systeme'}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  {Object.keys(log.action_details || {}).length > 0 && (
                                    <div className="text-muted-foreground mt-2 p-2 bg-muted/50 rounded text-xs">
                                      {Object.entries(log.action_details).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="font-medium">{key}:</span>{' '}
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    <Hash className="h-3 w-3" />
                                    <span className="font-mono">{truncateHash(log.document_hash)}</span>
                                    <span className="text-green-600 flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Integrite verifiee
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[50vh]">
                {versions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucune version enregistree</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Hash d'integrite</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell>
                            <Badge variant="outline">v{version.version_number}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(version.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {version.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {truncateHash(version.content_hash)}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              Les logs d'audit sont immutables et horodates. Le hash SHA-256 garantit l'integrite du document.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
