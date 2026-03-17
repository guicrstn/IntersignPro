import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Pencil, 
  FileSignature, 
  Download, 
  Send, 
  ArrowRightLeft,
  CheckCircle,
  Trash2,
  Building2,
  User,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import type { DocumentWithDetails, DocumentType, DocumentStatus } from '@/lib/types'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/types'
import { DocumentSignature } from '@/components/document-signature'
import { DocumentConvert } from '@/components/document-convert'
import { DocumentPDF } from '@/components/document-pdf'
import { DocumentDeleteButton } from '@/components/document-delete-button'
import { DocumentSendSignature } from '@/components/document-send-signature'

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  pending_signature: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  converted: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch document with client
  const { data: document } = await supabase
    .from('documents')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!document) {
    notFound()
  }

  // Fetch lines
  const { data: lines } = await supabase
    .from('document_lines')
    .select('*')
    .eq('document_id', id)
    .order('line_order')

  // Fetch totals
  const { data: totals } = await supabase
    .from('document_totals')
    .select('*')
    .eq('document_id', id)
    .single()

  // Fetch company info
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const doc = document as DocumentWithDetails
  const lineItems = lines || []
  const docTotals = totals

  // Determine next document type for conversion
  const getNextDocumentType = (type: DocumentType): DocumentType | null => {
    switch (type) {
      case 'devis':
        return 'commande'
      case 'commande':
        return 'livraison'
      case 'livraison':
        return 'facture'
      default:
        return null
    }
  }

  const nextDocType = getNextDocumentType(doc.document_type)
  const canConvert = doc.status === 'signed' && nextDocType !== null
  const canSign = doc.status === 'draft' || doc.status === 'sent'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{doc.document_number}</h1>
              <Badge variant="outline">
                {DOCUMENT_TYPE_LABELS[doc.document_type]}
              </Badge>
              <Badge className={statusColors[doc.status]}>
                {DOCUMENT_STATUS_LABELS[doc.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {new Date(doc.document_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {doc.status === 'draft' && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/documents/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          )}
          {(doc.status === 'draft' || doc.status === 'sent') && (
            <DocumentSendSignature
              documentId={id}
              documentNumber={doc.document_number}
              documentType={doc.document_type}
              clientEmail={doc.client?.email || null}
              clientName={doc.client?.name || ''}
            />
          )}
          <DocumentPDF documentId={id} documentNumber={doc.document_number} />
          <DocumentDeleteButton
            documentId={id}
            documentNumber={doc.document_number}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {doc.client?.client_type === 'professionnel' ? (
                    <Building2 className="h-6 w-6" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-lg">{doc.client?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {doc.client?.address}
                      {doc.client?.postal_code && `, ${doc.client?.postal_code}`}
                      {doc.client?.city && ` ${doc.client?.city}`}
                    </span>
                  </div>
                  {doc.client?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{doc.client?.email}</span>
                    </div>
                  )}
                  {doc.client?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{doc.client?.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Lignes du document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-right p-3 font-medium">Qte</th>
                      <th className="text-right p-3 font-medium">P.U. HT</th>
                      <th className="text-right p-3 font-medium">TVA</th>
                      <th className="text-right p-3 font-medium">Total HT</th>
                      <th className="text-right p-3 font-medium">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((line, index) => (
                      <tr key={line.id} className={index % 2 === 1 ? 'bg-muted/30' : ''}>
                        <td className="p-3">
                          <div>
                            {line.reference && (
                              <span className="text-xs text-muted-foreground font-mono mr-2">
                                [{line.reference}]
                              </span>
                            )}
                            <span>{line.description}</span>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {line.line_type === 'service' ? 'Prestation' : 
                             line.line_type === 'product' ? 'Materiel' :
                             line.line_type === 'shipping' ? 'Frais de port' : 'Remise'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {line.quantity} {line.unit}
                        </td>
                        <td className="p-3 text-right">{parseFloat(line.unit_price_ht).toFixed(2)} €</td>
                        <td className="p-3 text-right">{line.tva_rate}%</td>
                        <td className="p-3 text-right">{parseFloat(line.total_ht).toFixed(2)} €</td>
                        <td className="p-3 text-right font-medium">{parseFloat(line.total_ttc).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Signature Section */}
          {canSign && (
            <DocumentSignature
              documentId={id}
              documentType={doc.document_type}
              documentNumber={doc.document_number}
            />
          )}

          {/* Already Signed */}
          {doc.signature_data && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle>Document signe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="border rounded-lg p-2 bg-white">
                    <img
                      src={doc.signature_data}
                      alt="Signature"
                      className="h-24 w-auto"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {doc.signer_name && <p>Signe par: <strong>{doc.signer_name}</strong></p>}
                    {doc.signed_at && (
                      <p>Le: {new Date(doc.signed_at).toLocaleString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Totaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{docTotals ? parseFloat(docTotals.total_ht).toFixed(2) : '0.00'} €</span>
              </div>
              {docTotals?.tva_20 > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA 20%</span>
                  <span>{parseFloat(docTotals.tva_20).toFixed(2)} €</span>
                </div>
              )}
              {docTotals?.tva_10 > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA 10%</span>
                  <span>{parseFloat(docTotals.tva_10).toFixed(2)} €</span>
                </div>
              )}
              {docTotals?.tva_5_5 > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA 5,5%</span>
                  <span>{parseFloat(docTotals.tva_5_5).toFixed(2)} €</span>
                </div>
              )}
              {docTotals?.tva_2_1 > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA 2,1%</span>
                  <span>{parseFloat(docTotals.tva_2_1).toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total TVA</span>
                <span className="font-medium">{docTotals ? parseFloat(docTotals.total_tva).toFixed(2) : '0.00'} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total TTC</span>
                <span className="text-primary">{docTotals ? parseFloat(docTotals.total_ttc).toFixed(2) : '0.00'} €</span>
              </div>
            </CardContent>
          </Card>

          {/* Convert to next document */}
          {canConvert && nextDocType && (
            <DocumentConvert
              documentId={id}
              currentType={doc.document_type}
              nextType={nextDocType}
            />
          )}

          {/* Notes */}
          {(doc.subject || doc.notes || doc.terms) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doc.subject && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Objet</p>
                    <p className="text-sm">{doc.subject}</p>
                  </div>
                )}
                {doc.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
                  </div>
                )}
                {doc.terms && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conditions</p>
                    <p className="text-sm whitespace-pre-wrap">{doc.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
