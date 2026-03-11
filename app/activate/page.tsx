'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileSignature, Key, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ActivateLicensePage() {
  const router = useRouter()
  const [licenseKey, setLicenseKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Rediriger vers l'inscription avec la cle de licence
        router.push(`/auth/sign-up?license=${encodeURIComponent(licenseKey)}`)
        return
      }

      // Verifier la licence
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single()

      if (licenseError || !license) {
        throw new Error('Cle de licence invalide')
      }

      if (license.status !== 'active') {
        throw new Error('Cette licence n\'est plus active')
      }

      if (license.company_id) {
        throw new Error('Cette licence est deja utilisee')
      }

      // Recuperer la company de l'utilisateur
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!company) {
        throw new Error('Veuillez d\'abord creer votre compte entreprise')
      }

      // Activer la licence
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          company_id: company.id,
          activated_at: new Date().toISOString(),
        })
        .eq('id', license.id)

      if (updateError) throw updateError

      // Mettre a jour le statut d'abonnement de la company
      await supabase
        .from('companies')
        .update({
          subscription_status: 'active',
          subscription_plan: license.plan,
          subscription_end_date: license.expires_at,
        })
        .eq('id', company.id)

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'activation')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Licence activee !</h2>
            <p className="text-muted-foreground mb-4">
              Votre licence a ete activee avec succes. Redirection en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <FileSignature className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Activer votre licence</CardTitle>
          <CardDescription>
            Entrez la cle de licence fournie par votre revendeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="license">Cle de licence</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="license"
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="pl-10 font-mono"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Activation...' : 'Activer la licence'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                Creer un compte
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
