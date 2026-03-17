import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PlusCircle, 
  Package, 
  Wrench, 
  Pencil,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface Product {
  id: string
  reference: string | null
  name: string
  description: string | null
  category: string | null
  product_type: 'product' | 'service'
  unit_price_ht: number
  tva_rate: number
  unit: string
  is_active: boolean
  stock_quantity: number | null
  track_stock: boolean
}

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: products } = await supabase
    .from('product_catalog')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const activeProducts = (products || []).filter((p: Product) => p.is_active)
  const productCount = activeProducts.filter((p: Product) => p.product_type === 'product').length
  const serviceCount = activeProducts.filter((p: Product) => p.product_type === 'service').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogue</h1>
          <p className="text-muted-foreground">
            {productCount} produit{productCount > 1 ? 's' : ''} et {serviceCount} prestation{serviceCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/catalog/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestations</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Product list */}
      <Card>
        <CardHeader>
          <CardTitle>Articles du catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          {!products || products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun article</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter des produits ou prestations a votre catalogue
              </p>
              <Button asChild>
                <Link href="/dashboard/catalog/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un article
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${product.product_type === 'product' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {product.product_type === 'product' ? (
                        <Package className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Wrench className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        {product.reference && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {product.reference}
                          </span>
                        )}
                        {!product.is_active && (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.category && <span>{product.category} • </span>}
                        <span>{product.unit_price_ht.toFixed(2)} € HT / {product.unit}</span>
                        <span className="ml-2">TVA {product.tva_rate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">
                      {(product.unit_price_ht * (1 + product.tva_rate / 100)).toFixed(2)} € TTC
                    </span>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/catalog/${product.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
