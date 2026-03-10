import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Paiement reussi !</CardTitle>
          <CardDescription className="text-base">
            Merci pour votre confiance. Votre abonnement est maintenant actif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez maintenant acceder a toutes les fonctionnalites d&apos;InterSign Pro.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">Acceder au tableau de bord</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/interventions/new">Creer ma premiere intervention</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
