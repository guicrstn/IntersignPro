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
