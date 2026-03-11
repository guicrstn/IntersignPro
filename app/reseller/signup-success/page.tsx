import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail } from 'lucide-react'

export default function ResellerSignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Demande envoyee !</CardTitle>
          <CardDescription>
            Votre demande de compte revendeur a ete soumise avec succes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-medium">Verification par email</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Verifiez votre boite mail et cliquez sur le lien de confirmation pour activer votre compte.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Une fois votre email confirme, votre demande sera examinee par notre equipe.</p>
            <p className="mt-2">Delai de validation : 24-48h ouvrables</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/reseller/login">Aller a la page de connexion</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
