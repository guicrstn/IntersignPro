'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  KeyRound,
  Copy,
  Check,
  User,
  Mail,
  Calendar,
  Settings,
  Pause,
  Play,
} from 'lucide-react'
import type { License, LicenseOption } from '@/lib/types'
import { AVAILABLE_OPTIONS } from '@/lib/types'

export default function LicenseDetailPage() {
  const params = useParams()
  const [license, setLicense] = useState<License | null>(null)
  const [options, setOptions] = useState<LicenseOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchLicense = async () => {
      const supabase = createClient()

      const { data: licenseData } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (licenseData) {
        setLicense(licenseData)

        const { data: optionsData } = await supabase
          .from('license_options')
          .select('*')
          .eq('license_id', licenseData.id)

        if (optionsData) {
          setOptions(optionsData)
        }
      }

      setIsLoading(false)
    }

    fetchLicense()
  }, [params.id])

  const copyLicenseKey = () => {
    if (license) {
      navigator.clipboard.writeText(license.license_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleStatus = async () => {
    if (!license) return

    const supabase = createClient()
    const newStatus = license.status === 'active' ? 'suspended' : 'active'

    const { error } = await supabase
      .from('licenses')
      .update({ status: newStatus })
      .eq('id', license.id)

    if (!error) {
      setLicense({ ...license, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!license) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Licence non trouvee</p>
        <Button asChild className="mt-4">
          <Link href="/reseller/dashboard/licenses">Retour aux licences</Link>
        </Button>
      </div>
    )
  }

  const planPrices = { monthly: 29, annual: 290, lifetime: 590 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reseller/dashboard/licenses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{license.client_name}</h1>
            <p className="text-muted-foreground">{license.client_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleStatus}>
            {license.status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Suspendre
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activer
              </>
            )}
          </Button>
          <Button asChild>
            <Link href={`/reseller/dashboard/licenses/${license.id}/options`}>
              <Settings className="h-4 w-4 mr-2" />
              Gerer les options
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* License info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Cle de licence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <code className="flex-1 bg-muted p-4 rounded-lg font-mono text-lg">
                  {license.license_key}
                </code>
                <Button variant="outline" onClick={copyLicenseKey}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copie
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Le client doit utiliser cette cle pour activer son compte InterSign Pro.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{license.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{license.client_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de creation</p>
                  <p className="font-medium">
                    {new Date(license.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Options actives</CardTitle>
                <CardDescription>
                  Fonctionnalites supplementaires de cette licence
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/reseller/dashboard/licenses/${license.id}/options`}>
                  Modifier
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune option activee</p>
              ) : (
                <div className="space-y-3">
                  {options.map((opt) => {
                    const optionInfo = AVAILABLE_OPTIONS.find(o => o.key === opt.option_key)
                    return (
                      <div key={opt.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Check className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{optionInfo?.name}</p>
                          <p className="text-sm text-muted-foreground">{optionInfo?.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Etat</span>
                <Badge variant={
                  license.status === 'active' ? 'default' : 
                  license.status === 'suspended' ? 'secondary' : 'destructive'
                }>
                  {license.status === 'active' ? 'Active' : 
                   license.status === 'suspended' ? 'Suspendue' : 'Expiree'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge variant="outline" className="capitalize">{license.plan}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prix</span>
                <span className="font-semibold">{planPrices[license.plan as keyof typeof planPrices]}€</span>
              </div>
              {license.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expiration</span>
                  <span>
                    {new Date(license.expires_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={copyLicenseKey}>
                <Copy className="h-4 w-4 mr-2" />
                Copier la cle
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/reseller/dashboard/licenses/${license.id}/options`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Gerer les options
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
