'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { 
  Building2,
  User,
  Mail,
  Phone,
  Check,
} from 'lucide-react'
import type { Reseller } from '@/lib/types'

export default function ResellerSettingsPage() {
  const [reseller, setReseller] = useState<Reseller | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const fetchReseller = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('resellers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setReseller(data)
        setFormData({
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone || '',
        })
      }

      setIsLoading(false)
    }

    fetchReseller()
  }, [])

  const handleSave = async () => {
    if (!reseller) return

    setIsSaving(true)
    setSuccess(false)

    const supabase = createClient()

    const { error } = await supabase
      .from('resellers')
      .update({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        phone: formData.phone || null,
      })
      .eq('id', reseller.id)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez les informations de votre compte revendeur
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Vos informations de contact et de societe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nom de la societe</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Nom du contact</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={formData.email}
                disabled
                className="pl-10 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas etre modifie
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Modifications enregistrees
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </CardFooter>
      </Card>

      {/* Commission info */}
      <Card>
        <CardHeader>
          <CardTitle>Commission</CardTitle>
          <CardDescription>
            Votre taux de commission sur les ventes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="text-3xl font-bold text-primary">{reseller?.commission_rate}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Commission sur chaque vente effectuee
            </p>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Exemple de gains par vente :</p>
            <ul className="mt-2 space-y-1">
              <li>• Plan mensuel (29€) : <span className="font-medium text-foreground">{(29 * (reseller?.commission_rate || 20) / 100).toFixed(0)}€</span></li>
              <li>• Plan annuel (290€) : <span className="font-medium text-foreground">{(290 * (reseller?.commission_rate || 20) / 100).toFixed(0)}€</span></li>
              <li>• Plan lifetime (590€) : <span className="font-medium text-foreground">{(590 * (reseller?.commission_rate || 20) / 100).toFixed(0)}€</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
