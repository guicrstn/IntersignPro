'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileSignature, Shield, ArrowLeft, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check if user has 2FA enabled
      const { data: twoFactorData } = await supabase
        .from('user_two_factor')
        .select('is_enabled')
        .eq('user_id', data.user.id)
        .single()

      if (twoFactorData?.is_enabled) {
        // User has 2FA enabled, show 2FA input
        setRequires2FA(true)
      } else {
        // No 2FA, proceed to dashboard
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: twoFactorCode }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.usedBackupCode) {
          // Warn user they used a backup code
          console.log('Backup code used')
        }
        router.push('/dashboard')
      } else {
        setError(data.error || 'Code invalide')
      }
    } catch {
      setError('Erreur de verification')
    } finally {
      setIsLoading(false)
    }
  }

  const backToLogin = () => {
    setRequires2FA(false)
    setTwoFactorCode('')
    setError(null)
    // Sign out the partially authenticated user
    const supabase = createClient()
    supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <FileSignature className="h-8 w-8" />
              <span className="text-2xl font-bold">InterSign Pro</span>
            </div>
            <p className="text-sm text-muted-foreground text-balance text-center">
              Bons d&apos;intervention avec signature electronique
            </p>
          </div>

          {!requires2FA ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Connexion</CardTitle>
                <CardDescription>
                  Entrez vos identifiants pour acceder a votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    Pas encore de compte ?{' '}
                    <Link
                      href="/auth/sign-up"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Creer un compte
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Verification 2FA</CardTitle>
                </div>
                <CardDescription>
                  Entrez le code a 6 chiffres de votre application d&apos;authentification 
                  ou un code de secours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handle2FAVerification}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Code de verification</Label>
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        required
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ''))}
                        className="text-center text-2xl tracking-widest font-mono"
                        maxLength={8}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Code a 6 chiffres ou code de secours a 8 caracteres
                      </p>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || twoFactorCode.length < 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verification...
                        </>
                      ) : (
                        'Verifier'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={backToLogin}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour a la connexion
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
