'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  KeyRound,
  Check,
} from 'lucide-react'
import { AVAILABLE_OPTIONS, type OptionKey } from '@/lib/types'
import { cn } from '@/lib/utils'

const PLANS = [
  { id: 'monthly', name: 'Mensuel', price: 29, period: '/mois' },
  { id: 'annual', name: 'Annuel', price: 290, period: '/an', popular: true },
  { id: 'lifetime', name: 'Lifetime', price: 590, period: ' une fois' },
]

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = []
  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

export default function NewLicensePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('annual')
  const [selectedOptions, setSelectedOptions] = useState<OptionKey[]>([])
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
  })

  const toggleOption = (key: OptionKey) => {
    setSelectedOptions(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const calculateTotal = () => {
    const plan = PLANS.find(p => p.id === selectedPlan)
    let total = plan?.price || 0

    selectedOptions.forEach(optionKey => {
      const option = AVAILABLE_OPTIONS.find(o => o.key === optionKey)
      if (option) {
        if (selectedPlan === 'monthly') total += option.priceMonthly
        else if (selectedPlan === 'annual') total += option.priceAnnual
        else total += option.priceLifetime
      }
    })

    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Non authentifie')
      setIsLoading(false)
      return
    }

    try {
      // Get reseller ID
      const { data: reseller } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!reseller) throw new Error('Revendeur non trouve')

      // Generate license key
      const licenseKey = generateLicenseKey()

      // Create license (status pending until payment)
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          reseller_id: reseller.id,
          license_key: licenseKey,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          plan: selectedPlan,
          status: 'pending',
        })
        .select()
        .single()

      if (licenseError) {
        throw new Error(licenseError.message)
      }

      // Add options if selected
      if (selectedOptions.length > 0 && license) {
        const optionsToInsert = selectedOptions.map(key => ({
          license_id: license.id,
          option_key: key,
          option_value: 'enabled',
        }))

        await supabase.from('license_options').insert(optionsToInsert)
      }

      router.push(`/reseller/dashboard/licenses/${license.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reseller/dashboard/licenses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvelle licence</h1>
          <p className="text-muted-foreground">
            Creez une licence pour un nouveau client
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
              <CardDescription>
                Les informations du client qui utilisera cette licence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client / Societe</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clientName"
                    placeholder="Nom ou raison sociale"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email du client</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choix du plan</CardTitle>
              <CardDescription>
                Selectionnez le plan pour ce client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative cursor-pointer rounded-lg border-2 p-4 transition-colors',
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        Populaire
                      </span>
                    )}
                    <div className="text-center">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{plan.price}€</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                    </div>
                    {selectedPlan === plan.id && (
                      <div className="absolute top-2 left-2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options additionnelles</CardTitle>
              <CardDescription>
                Ajoutez des fonctionnalites supplementaires a la licence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {AVAILABLE_OPTIONS.map((option) => {
                  const price = selectedPlan === 'monthly' ? option.priceMonthly :
                    selectedPlan === 'annual' ? option.priceAnnual : option.priceLifetime
                  const period = selectedPlan === 'monthly' ? '/mois' :
                    selectedPlan === 'annual' ? '/an' : ''
                  const isSelected = selectedOptions.includes(option.key)

                  return (
                    <div 
                      key={option.key}
                      className={cn(
                        'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => toggleOption(option.key)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleOption(option.key)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{option.name}</h4>
                          <span className="font-semibold text-primary">
                            +{price}€{period}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan {PLANS.find(p => p.id === selectedPlan)?.name}</span>
                  <span>{PLANS.find(p => p.id === selectedPlan)?.price}€</span>
                </div>
                {selectedOptions.map(optionKey => {
                  const option = AVAILABLE_OPTIONS.find(o => o.key === optionKey)
                  const price = selectedPlan === 'monthly' ? option?.priceMonthly :
                    selectedPlan === 'annual' ? option?.priceAnnual : option?.priceLifetime
                  return (
                    <div key={optionKey} className="flex justify-between text-sm">
                      <span>{option?.name}</span>
                      <span>+{price}€</span>
                    </div>
                  )
                })}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{calculateTotal()}€</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPlan === 'monthly' ? 'Facturation mensuelle' :
                   selectedPlan === 'annual' ? 'Facturation annuelle' : 'Paiement unique'}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creation...' : 'Creer la licence'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
