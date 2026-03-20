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
  Shield,
  Mail,
  BarChart3,
  Package,
  Receipt,
  Truck,
  FileCheck
} from 'lucide-react'
import { PRODUCTS, TVA_RATE, calculateTTC, formatPrice } from '@/lib/products'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: FileText,
      title: 'Devis professionnels',
      description: 'Creez des devis detailles avec votre catalogue produits et envoyez-les pour signature electronique.',
    },
    {
      icon: Receipt,
      title: 'Bons de commande',
      description: 'Convertissez vos devis signes en bons de commande en un clic.',
    },
    {
      icon: Truck,
      title: 'Bons de livraison',
      description: 'Generez automatiquement vos BL avec signature client a la reception.',
    },
    {
      icon: FileCheck,
      title: 'Factures',
      description: 'Transformez vos documents en factures avec suivi des paiements et cachet "Paye".',
    },
    {
      icon: PenTool,
      title: 'Signature electronique',
      description: 'Envoyez vos documents par email pour signature a distance ou faites signer sur place.',
    },
    {
      icon: Mail,
      title: 'Envoi par email',
      description: 'Partagez le lien de signature par email, SMS ou WhatsApp directement depuis l\'app.',
    },
    {
      icon: Package,
      title: 'Catalogue produits',
      description: 'Gerez votre catalogue de produits et prestations avec prix et TVA personnalises.',
    },
    {
      icon: BarChart3,
      title: 'Tableau de bord financier',
      description: 'Suivez votre CA mensuel et annuel, analysez vos ventes par client et par type.',
    },
    {
      icon: Users,
      title: 'Gestion clients',
      description: 'Centralisez vos clients avec leur historique complet et statistiques financieres.',
    },
    {
      icon: ClipboardList,
      title: 'Bons d\'intervention',
      description: 'Creez des bons d\'intervention detailles pour vos prestations sur site.',
    },
    {
      icon: Smartphone,
      title: '100% Mobile',
      description: 'Application optimisee pour tablette et smartphone sur le terrain.',
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
      text: 'InterSign Pro a revolutionne ma gestion administrative. La signature electronique par email est un vrai gain de temps !',
    },
    {
      name: 'Marie L.',
      company: 'Electricite Plus',
      text: 'La chaine devis-commande-livraison-facture est parfaitement fluide. Mes clients sont impressionnes.',
    },
    {
      name: 'Thomas R.',
      company: 'Services Informatiques',
      text: 'Le tableau de bord financier me permet de suivre mon CA en temps reel. Indispensable !',
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
                Devis, commandes, livraisons et factures{' '}
                <span className="text-primary">signes en quelques secondes</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty">
                La solution complete pour les professionnels : creez vos devis, 
                envoyez-les pour signature electronique, et convertissez-les automatiquement 
                en bons de commande, bons de livraison et factures. 
                Suivez votre chiffre d&apos;affaires en temps reel.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Commencer l&apos;essai gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="#features">Decouvrir les fonctionnalites</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Document Flow */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Devis</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <Receipt className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Commande</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <Truck className="h-5 w-5 text-cyan-500" />
                <span className="font-medium">Livraison</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
                <FileCheck className="h-5 w-5 text-green-500" />
                <span className="font-medium">Facture</span>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Conversion automatique entre chaque etape avec signature electronique
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl mb-4">
              Une solution complete pour votre activite
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              De la creation du devis jusqu&apos;a l&apos;encaissement, gerez tout votre cycle commercial en un seul outil.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

        {/* Dashboard Preview */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl mb-4">
                Tableau de bord financier complet
              </h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
                Suivez en temps reel votre activite commerciale et votre chiffre d&apos;affaires.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CA Mensuel</p>
                      <p className="text-2xl font-bold text-primary">Temps reel</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CA Annuel</p>
                      <p className="text-2xl font-bold text-primary">Temps reel</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Devis signes</p>
                      <p className="text-2xl font-bold text-blue-500">Suivi</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Factures encaissees</p>
                      <p className="text-2xl font-bold text-green-500">Suivi</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">Analyse par client</p>
                  <p className="text-sm text-muted-foreground">CA, materiel vs prestations</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">Suivi des documents</p>
                  <p className="text-sm text-muted-foreground">Devis, commandes, factures</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="font-medium">Historique complet</p>
                  <p className="text-sm text-muted-foreground">Par dossier client</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                Tarifs simples et transparents
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Prix affiches HT - TVA {TVA_RATE}% applicable. Essai gratuit de 14 jours inclus pour les abonnements.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Chaque licence correspond a 1 utilisateur. Selectionnez le nombre de licences selon vos besoins.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRODUCTS.map((product) => {
                const priceTTC = calculateTTC(product.priceHT)
                return (
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
                      <div className="text-center mb-4">
                        <span className="text-4xl font-bold text-foreground">
                          {product.priceDisplay}
                        </span>
                        <span className="text-muted-foreground">{product.period}</span>
                      </div>
                      <p className="text-center text-xs text-muted-foreground mb-6">
                        soit {formatPrice(priceTTC)} TTC{product.mode === 'subscription' ? (product.interval === 'month' ? '/mois' : '/an') : ''}
                      </p>
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
                        <Link href={`/auth/sign-up?plan=${product.id}`}>
                          {product.mode === 'subscription' ? 'Commencer l\'essai' : 'Choisir cette offre'}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Besoin de plusieurs licences ? Contactez-nous pour un devis personnalise.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
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
              Pret a simplifier votre gestion commerciale ?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto text-pretty">
              Commencez votre essai gratuit de 14 jours aujourd&apos;hui.
              Devis, commandes, livraisons et factures en quelques clics.
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
