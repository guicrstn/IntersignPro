'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Save, User, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    notes: '',
    client_type: 'particulier' as 'particulier' | 'professionnel',
    siret: '',
    tva_number: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Vous devez etre connecte')
      setIsLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        notes: formData.notes || null,
        client_type: formData.client_type,
        siret: formData.client_type === 'professionnel' ? (formData.siret || null) : null,
        tva_number: formData.client_type === 'professionnel' ? (formData.tva_number || null) : null,
      })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push('/dashboard/clients')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouveau client</h1>
          <p className="text-muted-foreground">Ajoutez un nouveau client a votre liste</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Renseignez les coordonnees de votre client. Les champs marques d&apos;un * sont obligatoires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              {/* Client Type Selection */}
              <div className="grid gap-3">
                <Label>Type de client *</Label>
                <RadioGroup
                  value={formData.client_type}
                  onValueChange={(value: 'particulier' | 'professionnel') => 
                    setFormData(prev => ({ ...prev, client_type: value }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="particulier" id="particulier" />
                    <Label htmlFor="particulier" className="flex items-center gap-2 cursor-pointer font-normal">
                      <User className="h-4 w-4" />
                      Particulier
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professionnel" id="professionnel" />
                    <Label htmlFor="professionnel" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Building2 className="h-4 w-4" />
                      Professionnel
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nom / Raison sociale *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom du client ou de l'entreprise"
                  required
                />
              </div>

              {/* Professional fields - only shown for professionals */}
              {formData.client_type === 'professionnel' && (
                <div className="grid gap-4 sm:grid-cols-2 p-4 bg-muted/50 rounded-lg border">
                  <div className="grid gap-2">
                    <Label htmlFor="siret">Numero SIRET</Label>
                    <Input
                      id="siret"
                      name="siret"
                      value={formData.siret}
                      onChange={handleChange}
                      placeholder="123 456 789 00012"
                      maxLength={17}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tva_number">Numero de TVA</Label>
                    <Input
                      id="tva_number"
                      name="tva_number"
                      value={formData.tva_number}
                      onChange={handleChange}
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 rue de la Paix"
                  required
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

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Informations complementaires sur le client..."
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/clients">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
