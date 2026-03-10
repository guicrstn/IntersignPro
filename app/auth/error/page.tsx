import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSignature, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <FileSignature className="h-8 w-8" />
              <span className="text-2xl font-bold">InterSign Pro</span>
            </div>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Une erreur est survenue</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {params?.error ? (
                <p className="text-sm text-muted-foreground mb-4">
                  Erreur : {params.error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Une erreur inattendue s&apos;est produite lors de l&apos;authentification.
                </p>
              )}
              <Button asChild className="w-full">
                <Link href="/auth/login">Retour a la connexion</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
