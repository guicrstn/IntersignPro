'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Plus, Trash2, Loader2, Package, Search } from 'lucide-react'
import Link from 'next/link'
import type { Client, DocumentType, DocumentLine, LineType } from '@/lib/types'
import { TVA_RATES, DOCUMENT_TYPE_LABELS } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CatalogItem {
  id: string
  item_type: 'product' | 'service'
  reference: string | null
  name: string
  description: string | null
  unit: string
  price_ht: number
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
  discount_percent: number
}

function generateTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as DocumentType || 'devis'
  const clientParam = searchParams.get('client')

  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingClients, setIsFetchingClients] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    document_type: typeParam,
    client_id: clientParam || '',
    document_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    subject: '',
    notes: '',
    terms: '',
  })

  const [lines, setLines] = useState<LineItem[]>([
    {
      id: generateTempId(),
      line_type: 'service',
      reference: '',
      description: '',
      quantity: 1,
      unit: 'unite',
      unit_price_ht: 0,
      tva_rate: 20,
      discount_percent: 0,
    }
  ])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
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
      }
      setIsFetchingClients(false)
    }
    fetchData()
  }, [])

  // Calculate totals
  const calculateLineTotals = (line: LineItem) => {
    const subtotal = line.quantity * line.unit_price_ht
    const discountAmount = subtotal * (line.discount_percent / 100)
    const totalHT = subtotal - discountAmount
    const totalTVA = totalHT * (line.tva_rate / 100)
    const totalTTC = totalHT + totalTVA
    return { totalHT, totalTVA, totalTTC }
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
        discount_percent: 0,
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
          line_type: item.item_type === 'product' ? 'product' : 'service',
          reference: item.reference || '',
          description: item.name + (item.description ? '\n' + item.description : ''),
          unit: item.unit || 'unite',
          unit_price_ht: item.price_ht || 0,
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

    // Generate document number
    const { data: numberData, error: numberError } = await supabase
      .rpc('generate_document_number', { 
        p_user_id: user.id, 
        p_document_type: formData.document_type 
      })

    if (numberError) {
      setError('Erreur lors de la generation du numero')
      setIsLoading(false)
      return
    }

    // Create document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: formData.client_id,
        document_type: formData.document_type,
        document_number: numberData,
        document_date: formData.document_date,
        validity_date: formData.validity_date || null,
        subject: formData.subject || null,
        notes: formData.notes || null,
        terms: formData.terms || null,
        status: 'draft',
      })
      .select()
      .single()

    if (docError || !document) {
      setError(docError?.message || 'Erreur lors de la creation')
      setIsLoading(false)
      return
    }

    // Add lines
    const linesToInsert = lines.map((line, index) => ({
      document_id: document.id,
      line_order: index,
      line_type: line.line_type,
      reference: line.reference || null,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price_ht: line.unit_price_ht,
      tva_rate: line.tva_rate,
      discount_percent: line.discount_percent,
      discount_amount: 0,
    }))

    const { error: linesError } = await supabase
      .from('document_lines')
      .insert(linesToInsert)

    if (linesError) {
      // Rollback: delete document
      await supabase.from('documents').delete().eq('id', document.id)
      setError('Erreur lors de l\'ajout des lignes')
      setIsLoading(false)
      return
    }

    router.push(`/dashboard/documents/${document.id}`)
    router.refresh()
  }

  if (isFetchingClients) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Nouveau {DOCUMENT_TYPE_LABELS[formData.document_type as DocumentType]}
          </h1>
          <p className="text-muted-foreground">Creez un nouveau document</p>
        </div>
      </div>

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
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devis">Devis</SelectItem>
                    <SelectItem value="commande">Commande</SelectItem>
                    <SelectItem value="livraison">Bon de livraison</SelectItem>
                    <SelectItem value="facture">Facture</SelectItem>
                  </SelectContent>
                </Select>
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
            <CardDescription>Ajoutez les prestations et produits</CardDescription>
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
                            <SelectItem value="m2">m²</SelectItem>
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
                        <Label>Remise %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={line.discount_percent ?? 0}
                          onChange={(e) => handleLineChange(line.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 text-sm">
                      <span className="text-muted-foreground">
                        HT: <span className="font-medium text-foreground">{totalHT.toFixed(2)} €</span>
                      </span>
                      <span className="text-muted-foreground">
                        TTC: <span className="font-medium text-foreground">{totalTTC.toFixed(2)} €</span>
                      </span>
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
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <span className="font-medium">{totals.totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total TVA</span>
                <span className="font-medium">{totals.totalTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total TTC</span>
                <span className="text-primary">{totals.totalTTC.toFixed(2)} €</span>
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
              <Label>Notes (visibles sur le document)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes a afficher sur le document..."
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
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Creation...' : 'Creer le document'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/documents">Annuler</Link>
          </Button>
        </div>
      </form>

      {/* Catalog Selection Dialog */}
      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Selectionner un article du catalogue</DialogTitle>
            <DialogDescription>
              Choisissez un produit ou une prestation de votre catalogue
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, reference ou categorie..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mt-4">
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {catalog.length === 0 ? (
                  <div>
                    <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Aucun article dans le catalogue</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/dashboard/catalog/new">Creer un article</Link>
                    </Button>
                  </div>
                ) : (
                  <p>Aucun resultat pour "{catalogSearch}"</p>
                )}
              </div>
            ) : (
              filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelectCatalogItem(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      {item.reference && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {item.reference}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={item.item_type === 'product' ? 'text-blue-600' : 'text-green-600'}>
                        {item.item_type === 'product' ? 'Materiel' : 'Prestation'}
                      </span>
                      {item.category && <span>• {item.category}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium">{(item.price_ht || 0).toFixed(2)} € HT</div>
                    <div className="text-xs text-muted-foreground">TVA {item.tva_rate || 20}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewDocumentContent />
    </Suspense>
  )
}
