'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminSetupPage() {
  const router = useRouter()
  const [secretCode, setSecretCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const supabase = createClient()
      
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({ email: user.email || '', id: user.id })
      }

      // Check if there's already an admin
      const { data: admins } = await supabase
        .from('companies')
        .select('id')
        .eq('is_admin', true)
        .limit(1)

      setHasAdmin(admins && admins.length > 0)
    }
    checkStatus()
  }, [])

  const handleSetupAdmin = async () => {
    // Secret code to prevent unauthorized access
    // In production, you would use a more secure method
    if (secretCode !== 'INTERSIGN-ADMIN-2026') {
      setError('Code secret incorrect')
      return
    }

    if (!currentUser) {
      setError('Vous devez etre connecte')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('companies')
      .update({ is_admin: true })
      .eq('user_id', currentUser.id)

    if (updateError) {
      setError('Erreur lors de la configuration: ' + updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirect to admin dashboard after 2 seconds
    setTimeout(() => {
      router.push('/admin')
    }, 2000)
  }

  if (hasAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Configuration Administrateur</CardTitle>
          <CardDescription>
            {hasAdmin 
              ? 'Un administrateur existe deja. Contactez-le pour obtenir les droits.'
              : 'Configurez le premier compte administrateur pour InterSign Pro'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">
                Vous etes maintenant administrateur !
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection vers le panneau d&apos;administration...
              </p>
            </div>
          ) : hasAdmin ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                La configuration initiale a deja ete effectuee.
              </p>
              <Button variant="outline" onClick={() => router.push('/auth/login')}>
                Retour a la connexion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!currentUser ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vous devez d&apos;abord vous connecter.
                  </p>
                  <Button onClick={() => router.push('/auth/login')}>
                    Se connecter
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Connecte en tant que:</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secretCode">Code secret</Label>
                    <Input
                      id="secretCode"
                      type="password"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="Entrez le code secret"
                    />
                    <p className="text-xs text-muted-foreground">
                      Le code secret est: INTERSIGN-ADMIN-2026
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleSetupAdmin}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Configuration...' : 'Configurer comme administrateur'}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
