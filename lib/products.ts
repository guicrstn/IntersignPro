export interface Product {
  id: string
  name: string
  description: string
  priceHT: number // Prix HT en centimes
  tvaRate: number // Taux TVA (20%)
  priceDisplay: string
  period?: string
  popular?: boolean
  features: string[]
  mode: 'payment' | 'subscription'
  interval?: 'month' | 'year'
}

// Type pour les IDs de plan
export type PlanId = 'monthly' | 'annual' | 'lifetime'

// Taux de TVA
export const TVA_RATE = 20

// Calculer le prix TTC a partir du HT
export function calculateTTC(priceHTCents: number): number {
  return Math.round(priceHTCents * (1 + TVA_RATE / 100))
}

// Calculer le montant de TVA
export function calculateTVA(priceHTCents: number): number {
  return Math.round(priceHTCents * (TVA_RATE / 100))
}

export const PRODUCTS: Product[] = [
  {
    id: 'monthly',
    name: 'Mensuel',
    description: '1 licence utilisateur - Abonnement mensuel',
    priceHT: 2417, // 24,17€ HT = 29€ TTC
    tvaRate: TVA_RATE,
    priceDisplay: '24,17€',
    period: ' HT/mois',
    features: [
      '1 utilisateur',
      'Documents illimites (devis, commandes, BL, factures)',
      'Signature electronique par email',
      'Generation PDF avec logo',
      'Gestion clients illimitee',
      'Catalogue produits/services',
      'Tableau de bord financier',
      'Support par email',
    ],
    mode: 'subscription',
    interval: 'month',
  },
  {
    id: 'annual',
    name: 'Annuel',
    description: '1 licence utilisateur - 2 mois offerts',
    priceHT: 24167, // 241,67€ HT = 290€ TTC
    tvaRate: TVA_RATE,
    priceDisplay: '241,67€',
    period: ' HT/an',
    popular: true,
    features: [
      '1 utilisateur',
      'Documents illimites (devis, commandes, BL, factures)',
      'Signature electronique par email',
      'Generation PDF avec logo',
      'Gestion clients illimitee',
      'Catalogue produits/services',
      'Tableau de bord financier',
      'Support prioritaire',
      '2 mois offerts',
    ],
    mode: 'subscription',
    interval: 'year',
  },
  {
    id: 'lifetime',
    name: 'Licence a vie',
    description: '1 licence utilisateur - Paiement unique',
    priceHT: 49167, // 491,67€ HT = 590€ TTC
    tvaRate: TVA_RATE,
    priceDisplay: '491,67€',
    period: ' HT',
    features: [
      '1 utilisateur',
      'Documents illimites (devis, commandes, BL, factures)',
      'Signature electronique par email',
      'Generation PDF avec logo',
      'Gestion clients illimitee',
      'Catalogue produits/services',
      'Tableau de bord financier',
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

// Helper pour formater le prix
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + '€'
}
