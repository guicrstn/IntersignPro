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
  created_at: string
  updated_at: string
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
