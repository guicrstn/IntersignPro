export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  priceDisplay: string
  period?: string
  popular?: boolean
  features: string[]
  mode: 'payment' | 'subscription'
  interval?: 'month' | 'year'
}

// Type pour les IDs de plan
export type PlanId = 'monthly' | 'annual' | 'lifetime'

export const PRODUCTS: Product[] = [
  {
    id: 'monthly',
    name: 'Mensuel',
    description: 'Abonnement mensuel a InterSign Pro',
    priceInCents: 2900, // 29€/mois
    priceDisplay: '29€',
    period: '/mois',
    features: [
      'Bons d\'intervention illimites',
      'Signature electronique',
      'Generation PDF',
      'Gestion clients illimitee',
      'Support par email',
    ],
    mode: 'subscription',
    interval: 'month',
  },
  {
    id: 'annual',
    name: 'Annuel',
    description: 'Abonnement annuel a InterSign Pro - 2 mois offerts',
    priceInCents: 29000, // 290€/an (soit ~24€/mois)
    priceDisplay: '290€',
    period: '/an',
    popular: true,
    features: [
      'Bons d\'intervention illimites',
      'Signature electronique',
      'Generation PDF',
      'Gestion clients illimitee',
      'Support prioritaire',
      '2 mois offerts',
    ],
    mode: 'subscription',
    interval: 'year',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    description: 'Acces a vie a InterSign Pro',
    priceInCents: 59000, // 590€ une fois
    priceDisplay: '590€',
    period: ' une fois',
    features: [
      'Bons d\'intervention illimites',
      'Signature electronique',
      'Generation PDF',
      'Gestion clients illimitee',
      'Support prioritaire a vie',
      'Toutes les futures mises a jour',
      'Paiement unique',
    ],
    mode: 'payment',
  },
]

// Alias pour compatibilite avec les actions Stripe
export const PLANS = PRODUCTS

// Helper pour obtenir un plan par ID
export function getPlanById(id: PlanId): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}
