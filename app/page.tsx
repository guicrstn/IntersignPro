import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileSignature, Users, ClipboardList, PenTool, FileText } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <FileSignature className="h-7 w-7" />
            <span className="text-xl font-bold">InterSign Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              Vos bons d&apos;intervention{' '}
              <span className="text-primary">signes en quelques secondes</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              InterSign Pro simplifie la creation et la signature de vos bons d&apos;intervention.
              Gerez vos clients, generez des bons professionnels et faites-les signer
              directement sur tablette ou smartphone.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/auth/sign-up">Commencer gratuitement</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/auth/login">J&apos;ai deja un compte</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-card py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
              Tout ce dont vous avez besoin
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Gestion clients"
                description="Enregistrez vos clients et retrouvez leur historique d'interventions en un clic."
              />
              <FeatureCard
                icon={<ClipboardList className="h-6 w-6" />}
                title="Bons d'intervention"
                description="Creez des bons professionnels avec numerotation automatique et toutes les informations necessaires."
              />
              <FeatureCard
                icon={<PenTool className="h-6 w-6" />}
                title="Signature electronique"
                description="Faites signer vos clients directement sur l'ecran, pratique et rapide."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Export PDF"
                description="Telechargez vos bons signes au format PDF, prets a etre envoyes ou archives."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              Pret a simplifier vos interventions ?
            </h2>
            <p className="mt-4 text-primary-foreground/90">
              Rejoignez les professionnels qui utilisent deja InterSign Pro pour leurs bons d&apos;intervention.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/auth/sign-up">Creer mon compte gratuitement</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>InterSign Pro - Application de bons d&apos;intervention avec signature electronique</p>
          <p className="mt-2">Developpe par GC Informatik</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background border">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
