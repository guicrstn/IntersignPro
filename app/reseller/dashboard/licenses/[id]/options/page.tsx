'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Settings,
  Check,
} from 'lucide-react'
import type { License, LicenseOption, OptionKey } from '@/lib/types'
import { AVAILABLE_OPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function LicenseOptionsPage() {
  const params = useParams()
  const router = useRouter()
  const [license, setLicense] = useState<License | null>(null)
  const [currentOptions, setCurrentOptions] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<OptionKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
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
          .select('option_key')
          .eq('license_id', licenseData.id)

        if (optionsData) {
          const optionKeys = optionsData.map(o => o.option_key as OptionKey)
          setCurrentOptions(optionKeys)
          setSelectedOptions(optionKeys)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [params.id])

  const toggleOption = (key: OptionKey) => {
    setSelectedOptions(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleSave = async () => {
    if (!license) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      // Remove all current options
      await supabase
        .from('license_options')
        .delete()
        .eq('license_id', license.id)

      // Add selected options
      if (selectedOptions.length > 0) {
        const optionsToInsert = selectedOptions.map(key => ({
          license_id: license.id,
          option_key: key,
          option_value: 'enabled',
        }))

        await supabase.from('license_options').insert(optionsToInsert)
      }

      router.push(`/reseller/dashboard/licenses/${license.id}`)
    } catch (err) {
      console.error('Error saving options:', err)
    } finally {
      setIsSaving(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/reseller/dashboard/licenses/${license.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerer les options</h1>
          <p className="text-muted-foreground">
            {license.client_name} - {license.client_email}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Options disponibles
          </CardTitle>
          <CardDescription>
            Selectionnez les options a activer pour cette licence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AVAILABLE_OPTIONS.map((option) => {
              const price = license.plan === 'monthly' ? option.priceMonthly :
                license.plan === 'annual' ? option.priceAnnual : option.priceLifetime
              const period = license.plan === 'monthly' ? '/mois' :
                license.plan === 'annual' ? '/an' : ''
              const isSelected = selectedOptions.includes(option.key)
              const wasActive = currentOptions.includes(option.key)

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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{option.name}</h4>
                        {wasActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
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
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/reseller/dashboard/licenses/${license.id}`}>
              Annuler
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
