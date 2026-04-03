'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { ArrowLeft, Save, Plus, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import type { Client, DocumentType, LineType } from '@/lib/types'
import { TVA_RATES, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CatalogItem {
  id: string
  product_type: 'product' | 'service'
  reference: string | null
  name: string
  description: string | null
  unit: string
  unit_price_ht: number
  tva_rate: number
  category: string | null
}

interface LineItem {
  id: string
  line_type: LineType
  reference: string
  description: string
  quantity: number
  unit: string
  unit_price_ht: number
  tva_rate: number
  discount_type: 'percent' | 'amount'
  discount_percent: number
  discount_amount: number
}

function generateTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function EditDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<string>('')
  
  const [formData, setFormData] = useState({
    document_type: 'devis' as DocumentType,
    document_number: '',
    client_id: '',
    document_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    subject: '',
    notes: '',
    terms: '',
    hide_prices: false,
    status: 'draft' as string,
  })

  const [lines, setLines] = useState<LineItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (docError || !document) {
        setError('Document non trouve')
        setIsFetching(false)
        return
      }

      setOriginalStatus(document.status)
      setFormData({
        document_type: document.document_type,
        document_number: document.document_number,
        client_id: document.client_id,
        document_date: document.document_date,
        validity_date: document.validity_date || '',
        subject: document.subject || '',
        notes: document.notes || '',
        terms: document.terms || '',
        hide_prices: document.hide_prices || false,
        status: document.status,
      })

      // Fetch document lines
      const { data: linesData } = await supabase
        .from('document_lines')
        .select('*')
        .eq('document_id', documentId)
        .order('line_order')

      if (linesData && linesData.length > 0) {
        setLines(linesData.map(line => ({
          id: line.id,
          line_type: line.line_type,
          reference: line.reference || '',
          description: line.description || '',
          quantity: line.quantity,
          unit: line.unit,
          unit_price_ht: line.unit_price_ht,
          tva_rate: line.tva_rate,
          discount_type: line.discount_amount > 0 ? 'amount' : 'percent',
          discount_percent: line.discount_percent || 0,
          discount_amount: line.discount_amount || 0,
        })))
      } else {
        setLines([{
          id: generateTempId(),
          line_type: 'service',
          reference: '',
          description: '',
          quantity: 1,
          unit: 'unite',
          unit_price_ht: 0,
          tva_rate: 20,
          discount_type: 'percent',
          discount_percent: 0,
          discount_amount: 0,
        }])
      }

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      
      if (clientsData) setClients(clientsData)

      // Fetch catalog
      const { data: catalogData } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')
      
      if (catalogData) setCatalog(catalogData)

      setIsFetching(false)
    }
    fetchData()
  }, [documentId, router])

  // Calculate totals
  const calculateLineTotals = (line: LineItem) => {
    const subtotal = line.quantity * line.unit_price_ht
    let discountAmount = 0
    if (line.discount_type === 'percent') {
      discountAmount = subtotal * ((line.discount_percent || 0) / 100)
    } else {
      discountAmount = line.discount_amount || 0
    }
    const totalHT = Math.max(0, subtotal - discountAmount)
    const totalTVA = totalHT * (line.tva_rate / 100)
    const totalTTC = totalHT + totalTVA
    return { totalHT, totalTVA, totalTTC, discountAmount }
  }

  const totals = lines.reduce(
    (acc, line) => {
      const { totalHT, totalTVA, totalTTC } = calculateLineTotals(line)
      return {
        totalHT: acc.totalHT + totalHT,
        totalTVA: acc.totalTVA + totalTVA,
        totalTTC: acc.totalTTC + totalTTC,
      }
    },
    { totalHT: 0, totalTVA: 0, totalTTC: 0 }
  )

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: generateTempId(),
        line_type: 'service',
        reference: '',
        description: '',
        quantity: 1,
        unit: 'unite',
        unit_price_ht: 0,
        tva_rate: 20,
        discount_type: 'percent',
        discount_percent: 0,
        discount_amount: 0,
      }
    ])
  }

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id))
    }
  }

  const handleLineChange = (id: string, field: keyof LineItem, value: string | number) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const handleSelectCatalogItem = (item: CatalogItem) => {
    if (selectedLineId) {
      setLines(lines.map(line => 
        line.id === selectedLineId ? {
          ...line,
          line_type: item.product_type === 'product' ? 'product' : 'service',
          reference: item.reference || '',
          description: item.name + (item.description ? '\n' + item.description : ''),
          unit: item.unit || 'unite',
          unit_price_ht: item.unit_price_ht || 0,
          tva_rate: item.tva_rate || 20,
        } : line
      ))
    }
    setCatalogDialogOpen(false)
    setCatalogSearch('')
    setSelectedLineId(null)
  }

  const openCatalogDialog = (lineId: string) => {
    setSelectedLineId(lineId)
    setCatalogDialogOpen(true)
  }

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    item.reference?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    item.category?.toLowerCase().includes(catalogSearch.toLowerCase())
  )

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

    // Update document
    const { error: docError } = await supabase
      .from('documents')
      .update({
        client_id: formData.client_id,
        document_date: formData.document_date,
        validity_date: formData.validity_date || null,
        subject: formData.subject || null,
        notes: formData.notes || null,
        terms: formData.terms || null,
        hide_prices: formData.hide_prices,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (docError) {
      setError(docError.message || 'Erreur lors de la modification')
      setIsLoading(false)
      return
    }

    // Delete old lines
    await supabase
      .from('document_lines')
      .delete()
      .eq('document_id', documentId)

    // Add new lines
    const linesToInsert = lines.map((line, index) => ({
      document_id: documentId,
      line_order: index,
      line_type: line.line_type,
      reference: line.reference || null,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price_ht: line.unit_price_ht,
      tva_rate: line.tva_rate,
      discount_percent: line.discount_type === 'percent' ? (line.discount_percent || 0) : 0,
      discount_amount: line.discount_type === 'amount' ? (line.discount_amount || 0) : 0,
    }))

    const { error: linesError } = await supabase
      .from('document_lines')
      .insert(linesToInsert)

    if (linesError) {
      setError('Erreur lors de la modification des lignes')
      setIsLoading(false)
      return
    }

    router.push(`/dashboard/documents/${documentId}`)
    router.refresh()
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isConverted = originalStatus === 'converted'
  const isSigned = originalStatus === 'signed'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/documents/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Modifier {formData.document_number}
            </h1>
            <Badge variant="outline">
              {DOCUMENT_TYPE_LABELS[formData.document_type]}
            </Badge>
            <Badge variant="secondary">
              {DOCUMENT_STATUS_LABELS[formData.status as keyof typeof DOCUMENT_STATUS_LABELS]}
            </Badge>
          </div>
          <p className="text-muted-foreground">Modifiez les informations du document</p>
        </div>
      </div>

      {(isConverted || isSigned) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention :</strong> Ce document a deja ete {isConverted ? 'converti' : 'signe'}. 
            Toute modification peut affecter la coherence de votre comptabilite. 
            Assurez-vous de mettre a jour les documents lies si necessaire.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations generales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type de document</Label>
                <Input 
                  value={DOCUMENT_TYPE_LABELS[formData.document_type]} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label>Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Date du document</Label>
                <Input
                  type="date"
                  value={formData.document_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_date: e.target.value }))}
                />
              </div>
              {formData.document_type === 'devis' && (
                <div className="grid gap-2">
                  <Label>Date de validite</Label>
                  <Input
                    type="date"
                    value={formData.validity_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, validity_date: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Objet</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Objet du document..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
            <CardDescription>Modifiez les prestations et produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, index) => {
                const { totalHT, totalTTC } = calculateLineTotals(line)
                return (
                  <div key={line.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Ligne {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openCatalogDialog(line.id)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Catalogue
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(line.id)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select
                          value={line.line_type}
                          onValueChange={(value) => handleLineChange(line.id, 'line_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Prestation</SelectItem>
                            <SelectItem value="product">Materiel</SelectItem>
                            <SelectItem value="shipping">Frais de port</SelectItem>
                            <SelectItem value="discount">Remise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Reference</Label>
                        <Input
                          value={line.reference || ''}
                          onChange={(e) => handleLineChange(line.id, 'reference', e.target.value)}
                          placeholder="REF-001"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={line.description || ''}
                        onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                        placeholder="Description de la prestation ou du materiel..."
                        rows={2}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-5">
                      <div className="grid gap-2">
                        <Label>Quantite</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={line.quantity ?? 1}
                          onChange={(e) => handleLineChange(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Unite</Label>
                        <Select
                          value={line.unit || 'unite'}
                          onValueChange={(value) => handleLineChange(line.id, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unite">Unite</SelectItem>
                            <SelectItem value="heure">Heure</SelectItem>
                            <SelectItem value="jour">Jour</SelectItem>
                            <SelectItem value="forfait">Forfait</SelectItem>
                            <SelectItem value="m2">m2</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Prix HT</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price_ht ?? 0}
                          onChange={(e) => handleLineChange(line.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>TVA</Label>
                        <Select
                          value={(line.tva_rate ?? 20).toString()}
                          onValueChange={(value) => handleLineChange(line.id, 'tva_rate', parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TVA_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={rate.value.toString()}>
                                {rate.value}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Remise</Label>
                        <div className="flex gap-2">
                          <Select
                            value={line.discount_type || 'percent'}
                            onValueChange={(value) => handleLineChange(line.id, 'discount_type', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="amount">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="0"
                            max={line.discount_type === 'percent' ? 100 : undefined}
                            step="0.01"
                            value={line.discount_type === 'percent' ? (line.discount_percent ?? 0) : (line.discount_amount ?? 0)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              if (line.discount_type === 'percent') {
                                handleLineChange(line.id, 'discount_percent', val)
                                handleLineChange(line.id, 'discount_amount', 0)
                              } else {
                                handleLineChange(line.id, 'discount_amount', val)
                                handleLineChange(line.id, 'discount_percent', 0)
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 text-sm">
                      <span>Total HT: <strong>{totalHT.toFixed(2)} EUR</strong></span>
                      <span>Total TTC: <strong>{totalTTC.toFixed(2)} EUR</strong></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Recapitulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{totals.totalHT.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{totals.totalTVA.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total TTC</span>
                <span className="font-bold text-lg">{totals.totalTTC.toFixed(2)} EUR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes et conditions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes internes ou pour le client..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Conditions</Label>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Conditions de paiement, delais, etc..."
                rows={3}
              />
            </div>
            {(formData.document_type === 'livraison') && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="hide-prices"
                  checked={formData.hide_prices}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hide_prices: checked as boolean }))}
                />
                <Label htmlFor="hide-prices" className="text-sm font-normal cursor-pointer">
                  Masquer les prix sur ce bon de livraison
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button asChild variant="outline">
            <Link href={`/dashboard/documents/${documentId}`}>
              Annuler
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Catalog Dialog */}
      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catalogue produits/services</DialogTitle>
            <DialogDescription>
              Selectionnez un article du catalogue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Rechercher..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
            <div className="space-y-2">
              {filteredCatalog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun article trouve
                </p>
              ) : (
                filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectCatalogItem(item)}
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.reference && `${item.reference} - `}
                        {item.unit_price_ht.toFixed(2)} EUR HT
                      </p>
                    </div>
                    <Badge variant="outline">
                      {item.product_type === 'product' ? 'Produit' : 'Service'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
