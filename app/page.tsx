import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileSignature, 
  Users, 
  ClipboardList, 
  PenTool, 
  FileText,
  Check,
  ArrowRight,
  Star,
  Zap,
  Crown,
  Smartphone,
  Shield
} from 'lucide-react'
import { PRODUCTS } from '@/lib/products'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: Users,
      title: 'Gestion clients',
      description: 'Enregistrez vos clients et retrouvez leur historique d\'interventions en un clic.',
    },
    {
      icon: ClipboardList,
      title: 'Bons d\'intervention',
      description: 'Creez des bons professionnels avec numerotation automatique.',
    },
    {
      icon: PenTool,
      title: 'Signature electronique',
      description: 'Faites signer vos clients directement sur l\'ecran.',
    },
    {
      icon: FileText,
      title: 'Export PDF',
      description: 'Telechargez vos bons signes au format PDF.',
    },
    {
      icon: Smartphone,
      title: '100% Mobile',
      description: 'Optimise pour tablette et smartphone sur le terrain.',
    },
    {
      icon: Shield,
      title: 'Donnees securisees',
      description: 'Vos donnees chiffrees et sauvegardees en temps reel.',
    },
  ]

  const testimonials = [
    {
      name: 'Pierre D.',
      company: 'Plomberie Express',
      text: 'InterSign Pro a revolutionne ma gestion administrative. Fini les bons papier perdus !',
    },
    {
      name: 'Marie L.',
      company: 'Electricite Plus',
      text: 'Mes clients sont impressionnes par le professionnalisme des bons signes numeriquement.',
    },
    {
      name: 'Thomas R.',
      company: 'Services Informatiques',
      text: 'Simple, efficace, et le support est excellent. Je recommande a 100%.',
    },
  ]

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly': return <Zap className="h-6 w-6" />
      case 'annual': return <Star className="h-6 w-6" />
      case 'lifetime': return <Crown className="h-6 w-6" />
      default: return null
    }
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <FileSignature className="h-7 w-7" />
            <span className="text-xl font-bold">InterSign Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalites
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Temoignages
            </Link>
          </nav>
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

      <main>
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                14 jours d&apos;essai gratuit
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                Vos bons d&apos;intervention{' '}
                <span className="text-primary">signes en quelques secondes</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty">
                L&apos;application pour les professionnels qui se deplacent.
                Creez, faites signer et archivez vos bons d&apos;intervention
                directement depuis votre tablette ou smartphone.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="#features">Decouvrir les fonctionnalites</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Sans carte bancaire pour l&apos;essai
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Une solution complete pour digitaliser vos interventions terrain.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                Tarifs simples et transparents
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choisissez la formule adaptee a votre activite. Essai gratuit de 14 jours inclus.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRODUCTS.map((product) => (
                <Card 
                  key={product.id} 
                  className={cn(
                    'relative flex flex-col',
                    product.popular && 'border-primary shadow-lg md:scale-105'
                  )}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        Recommande
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={cn(
                      'mx-auto mb-4 p-3 rounded-full',
                      product.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {getPlanIcon(product.id)}
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        {product.priceDisplay}
                      </span>
                      <span className="text-muted-foreground">{product.period}</span>
                    </div>
                    {product.mode === 'subscription' && (
                      <p className="text-center text-sm text-accent font-medium mb-4">
                        14 jours d&apos;essai gratuit
                      </p>
                    )}
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={product.popular ? 'default' : 'outline'}
                      className="w-full"
                      asChild
                    >
                      <Link href="/auth/sign-up">
                        {product.mode === 'subscription' ? 'Essayer gratuitement' : 'Choisir'}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Rejoignez des centaines de professionnels qui ont adopte InterSign Pro.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold md:text-3xl mb-4 text-balance">
              Pret a digitaliser vos interventions ?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto text-pretty">
              Commencez votre essai gratuit de 14 jours aujourd&apos;hui.
              Aucune carte bancaire requise.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">
                Creer mon compte gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">InterSign Pro</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Mentions legales
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                CGV
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              2026 InterSign Pro - Developpe par GC Informatik
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
