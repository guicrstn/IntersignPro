import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileSignature, 
  Users, 
  TrendingUp, 
  Shield,
  BadgePercent,
  Zap,
  HeadphonesIcon,
  Gift
} from 'lucide-react'

export default function ResellerLandingPage() {
  const benefits = [
    {
      icon: BadgePercent,
      title: 'Commission attractive',
      description: '20% de commission sur chaque vente, paiements mensuels',
    },
    {
      icon: Zap,
      title: 'Demarrage rapide',
      description: 'Inscription simple, acces immediat au portail partenaire',
    },
    {
      icon: HeadphonesIcon,
      title: 'Support dedie',
      description: 'Un interlocuteur dedie pour vous accompagner',
    },
    {
      icon: Gift,
      title: 'Ressources marketing',
      description: 'Logos, brochures et supports de vente fournis',
    },
  ]

  const stats = [
    { value: '500+', label: 'Entreprises utilisatrices' },
    { value: '50K+', label: 'Interventions signees' },
    { value: '99.9%', label: 'Disponibilite' },
    { value: '20%', label: 'Commission garantie' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">InterSign Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/reseller/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/reseller/signup">Devenir revendeur</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Programme Revendeur</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Developpez votre activite avec InterSign Pro
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Rejoignez notre reseau de revendeurs et proposez a vos clients 
            la solution de bons d&apos;intervention avec signature electronique 
            la plus complete du marche.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/reseller/signup">
                Devenir revendeur
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#benefits">
                En savoir plus
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi devenir revendeur ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un programme partenaire concu pour votre succes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comment ca marche ?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Inscrivez-vous</h3>
              <p className="text-sm text-muted-foreground">
                Remplissez le formulaire d&apos;inscription et attendez la validation
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Creez des licences</h3>
              <p className="text-sm text-muted-foreground">
                Generez des licences pour vos clients depuis votre portail
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Gagnez des commissions</h3>
              <p className="text-sm text-muted-foreground">
                Recevez 20% de commission sur chaque vente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Pret a rejoindre le programme ?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Inscrivez-vous gratuitement et commencez a generer des revenus 
                en proposant InterSign Pro a vos clients.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/reseller/signup">
                  Commencer maintenant
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} InterSign Pro. Tous droits reserves.</p>
        </div>
      </footer>
    </div>
  )
}
