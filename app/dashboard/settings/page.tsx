'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Building2, Upload, ImageIcon, X } from 'lucide-react'
import type { Company } from '@/lib/types'
import Image from 'next/image'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    phone: '',
    email: '',
    siret: '',
  })

  useEffect(() => {
    const fetchCompany = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setCompany(data)
          // Le logo_url stocke le pathname, on construit l'URL de l'API
          setLogoUrl(data.logo_url ? `/api/logo?pathname=${encodeURIComponent(data.logo_url)}` : null)
          setFormData({
            name: data.name || '',
            address: data.address || '',
            postal_code: data.postal_code || '',
            city: data.city || '',
            phone: data.phone || '',
            email: data.email || '',
            siret: data.siret || '',
          })
        }
      }
      setIsFetching(false)
    }
    fetchCompany()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      const { url } = await response.json()
      setLogoUrl(url)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    if (!company) {
      setError('Societe non trouvee')
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        name: formData.name,
        address: formData.address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        siret: formData.siret || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    router.refresh()
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parametres</h1>
        <p className="text-muted-foreground">Configurez les informations de votre societe</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Informations de la societe</CardTitle>
            </div>
            <CardDescription>
              Ces informations apparaitront sur vos bons d&apos;intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom de la societe *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="GC Informatik"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 rue de la Paix"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="75001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Paris"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@exemple.com"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                    placeholder="123 456 789 00012"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600">Informations enregistrees avec succes</p>
              )}

              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle>Logo de la societe</CardTitle>
            </div>
            <CardDescription>
              Votre logo apparaitra sur les bons d&apos;intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-16 border rounded-lg overflow-hidden bg-white">
                    <Image
                      src={logoUrl}
                      alt="Logo de la societe"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Logo actuel</p>
                    <label className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        {isUploading ? 'Chargement...' : 'Changer le logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Chargement en cours...' : 'Cliquez pour telecharger votre logo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou SVG (max. 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
