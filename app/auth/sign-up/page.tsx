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
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { FileSignature } from 'lucide-react'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            company_name: companyName,
          },
        },
      })
      if (error) throw error
      
      // Si l'utilisateur est confirme automatiquement (email confirm desactive)
      // on le redirige vers le checkout si un plan a ete selectionne
      if (data.session) {
        // Creer la company pour l'utilisateur
        await supabase.from('companies').insert({
          user_id: data.user?.id,
          name: companyName,
        })
        
        // Rediriger vers le checkout si un plan a ete selectionne, sinon vers le dashboard
        if (planId) {
          router.push(`/checkout?plan=${planId}`)
        } else {
          router.push('/pricing')
        }
      } else {
        // Sinon on affiche la page de confirmation avec le plan en parametre
        const successUrl = planId ? `/auth/sign-up-success?plan=${planId}` : '/auth/sign-up-success'
        router.push(successUrl)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
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
              Creez votre compte professionnel
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Inscription</CardTitle>
              <CardDescription>
                Renseignez vos informations pour creer votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company">Nom de votre societe</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="GC Informatik"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
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
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Confirmer le mot de passe</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creation en cours...' : 'Creer mon compte'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Deja un compte ?{' '}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Se connecter
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
