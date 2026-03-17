export interface Company {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  siret: string | null
  // Subscription fields
  subscription_status: 'trial' | 'active' | 'canceled' | 'past_due' | 'inactive' | null
  subscription_plan: 'monthly' | 'annual' | 'lifetime' | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_used: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string
  city: string | null
  postal_code: string | null
  notes: string | null
  client_type: 'particulier' | 'professionnel'
  siret: string | null
  tva_number: string | null
  created_at: string
  updated_at: string
}

export interface QuoteLine {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Intervention {
  id: string
  user_id: string
  client_id: string
  intervention_number: string
  date: string
  description: string
  status: 'draft' | 'signed' | 'sent'
  signature_data: string | null
  signed_at: string | null
  signer_name: string | null
  quote_lines: QuoteLine[] | null
  quote_pdf_url: string | null
  quote_imported_at: string | null
  created_at: string
  updated_at: string
}

export interface InterventionWithClient extends Intervention {
  client: Client
}

// Reseller types
export interface Reseller {
  id: string
  user_id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  commission_rate: number
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export interface License {
  id: string
  reseller_id: string
  license_key: string
  client_email: string
  client_name: string
  plan: 'monthly' | 'annual' | 'lifetime'
  status: 'active' | 'suspended' | 'expired'
  activated_at: string | null
  expires_at: string | null
  company_id: string | null
  created_at: string
  updated_at: string
}

export interface LicenseOption {
  id: string
  license_id: string
  option_key: string
  option_value: string
  created_at: string
}

export interface LicenseWithOptions extends License {
  options: LicenseOption[]
}

export type OptionKey = 'quote_import'

export interface AvailableOption {
  key: OptionKey
  name: string
  description: string
  priceMonthly: number
  priceAnnual: number
  priceLifetime: number
}

export const AVAILABLE_OPTIONS: AvailableOption[] = [
  {
    key: 'quote_import',
    name: 'Import de devis',
    description: 'Permet d\'importer un devis PDF et d\'extraire automatiquement les lignes pour le bon d\'intervention',
    priceMonthly: 10,
    priceAnnual: 100,
    priceLifetime: 150,
  },
]

// API types
export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

// Hour contracts types
export interface HourContract {
  id: string
  user_id: string
  client_id: string
  name: string
  total_hours: number
  remaining_hours: number
  status: 'active' | 'expired' | 'consumed'
  notes: string | null
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface HourUsage {
  id: string
  user_id: string
  contract_id: string
  intervention_id: string | null
  hours_used: number
  travel_hours: number
  description: string | null
  usage_date: string
  created_at: string
}

// Document types for quotes, orders, deliveries, invoices
export type DocumentType = 'devis' | 'commande' | 'livraison' | 'facture'
export type DocumentStatus = 'draft' | 'sent' | 'pending_signature' | 'signed' | 'converted' | 'cancelled'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type LineType = 'service' | 'product' | 'discount' | 'shipping'
export type TvaRate = 20 | 10 | 5.5 | 2.1

export interface Document {
  id: string
  user_id: string
  client_id: string
  document_type: DocumentType
  document_number: string
  parent_document_id: string | null
  status: DocumentStatus
  document_date: string
  validity_date: string | null
  due_date: string | null
  subject: string | null
  notes: string | null
  internal_notes: string | null
  terms: string | null
  payment_method: string | null
  payment_status: PaymentStatus | null
  signature_data: string | null
  signer_name: string | null
  signed_at: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
}

export interface DocumentLine {
  id: string
  document_id: string
  line_order: number
  line_type: LineType
  reference: string | null
  description: string
  quantity: number
  unit: string
  unit_price_ht: number
  discount_percent: number
  discount_amount: number
  tva_rate: number
  total_ht: number
  total_tva: number
  total_ttc: number
  created_at: string
}

export interface DocumentTotals {
  id: string
  document_id: string
  total_ht: number
  total_discount: number
  total_ht_after_discount: number
  tva_20: number
  tva_10: number
  tva_5_5: number
  tva_2_1: number
  total_tva: number
  total_ttc: number
  updated_at: string
}

export interface DocumentWithClient extends Document {
  client: Client
}

export interface DocumentWithDetails extends DocumentWithClient {
  lines: DocumentLine[]
  totals: DocumentTotals | null
}

// TVA rates available in France
export const TVA_RATES: { value: number; label: string }[] = [
  { value: 20, label: '20% (Taux normal)' },
  { value: 10, label: '10% (Taux intermediaire)' },
  { value: 5.5, label: '5,5% (Taux reduit)' },
  { value: 2.1, label: '2,1% (Taux super-reduit)' },
]

// Document type labels
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  devis: 'Devis',
  commande: 'Commande',
  livraison: 'Bon de livraison',
  facture: 'Facture',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoye',
  pending_signature: 'En attente de signature',
  signed: 'Signe',
  converted: 'Converti',
  cancelled: 'Annule',
}
