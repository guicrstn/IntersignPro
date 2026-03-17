'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Package, Wrench } from 'lucide-react'
import Link from 'next/link'
import { TVA_RATES } from '@/lib/types'

export default function NewCatalogItemPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    description: '',
    category: '',
    product_type: 'product' as 'product' | 'service',
    unit_price_ht: '',
    tva_rate: '20',
    unit: 'unite',
    track_stock: false,
    stock_quantity: '0',
    stock_alert_threshold: '5',
    is_active: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Vous devez etre connecte')
        return
      }

      const { error: insertError } = await supabase
        .from('product_catalog')
        .insert({
          user_id: user.id,
          reference: formData.reference || null,
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          product_type: formData.product_type,
          unit_price_ht: parseFloat(formData.unit_price_ht) || 0,
          tva_rate: parseFloat(formData.tva_rate),
          unit: formData.unit,
          track_stock: formData.track_stock,
          stock_quantity: formData.track_stock ? parseInt(formData.stock_quantity) || 0 : 0,
          stock_alert_threshold: parseInt(formData.stock_alert_threshold) || 5,
          is_active: formData.is_active,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push('/dashboard/catalog')
    } catch {
      setError('Erreur lors de la creation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/catalog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvel article</h1>
          <p className="text-muted-foreground">Ajoutez un produit ou une prestation au catalogue</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;article</CardTitle>
          <CardDescription>
            Les champs marques d&apos;un * sont obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Type selection */}
            <div className="grid gap-3">
              <Label>Type d&apos;article *</Label>
              <RadioGroup
                value={formData.product_type}
                onValueChange={(value: 'product' | 'service') => 
                  setFormData(prev => ({ ...prev, product_type: value, track_stock: value === 'product' ? prev.track_stock : false }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product" id="product" />
                  <Label htmlFor="product" className="flex items-center gap-2 cursor-pointer font-normal">
                    <Package className="h-4 w-4" />
                    Produit / Materiel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="service" id="service" />
                  <Label htmlFor="service" className="flex items-center gap-2 cursor-pointer font-normal">
                    <Wrench className="h-4 w-4" />
                    Prestation / Service
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="REF-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categorie</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Informatique, Reseau, etc."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nom du produit ou de la prestation"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description detaillee..."
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="unit_price_ht">Prix unitaire HT *</Label>
                <div className="relative">
                  <Input
                    id="unit_price_ht"
                    name="unit_price_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price_ht}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tva_rate">Taux de TVA *</Label>
                <Select
                  value={formData.tva_rate}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tva_rate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TVA_RATES.map((rate) => (
                      <SelectItem key={rate.value} value={rate.value.toString()}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unite</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unite">Unite</SelectItem>
                    <SelectItem value="heure">Heure</SelectItem>
                    <SelectItem value="jour">Jour</SelectItem>
                    <SelectItem value="forfait">Forfait</SelectItem>
                    <SelectItem value="m">Metre</SelectItem>
                    <SelectItem value="m2">M²</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview TTC */}
            {formData.unit_price_ht && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Prix TTC</span>
                  <span className="text-xl font-bold">
                    {(parseFloat(formData.unit_price_ht) * (1 + parseFloat(formData.tva_rate) / 100)).toFixed(2)} €
                  </span>
                </div>
              </div>
            )}

            {/* Stock management - only for products */}
            {formData.product_type === 'product' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="track_stock">Gestion du stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer le suivi des quantites en stock
                    </p>
                  </div>
                  <Switch
                    id="track_stock"
                    checked={formData.track_stock}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_stock: checked }))}
                  />
                </div>

                {formData.track_stock && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="stock_quantity">Quantite en stock</Label>
                      <Input
                        id="stock_quantity"
                        name="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock_alert_threshold">Seuil d&apos;alerte</Label>
                      <Input
                        id="stock_alert_threshold"
                        name="stock_alert_threshold"
                        type="number"
                        min="0"
                        value={formData.stock_alert_threshold}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="is_active">Article actif</Label>
                <p className="text-sm text-muted-foreground">
                  Les articles inactifs n&apos;apparaissent pas dans les selections
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/catalog">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
