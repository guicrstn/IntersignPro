-- Rendre company_id nullable car la licence peut etre creee avant que le client s'inscrive
ALTER TABLE licenses ALTER COLUMN company_id DROP NOT NULL;

-- Ajouter des colonnes pour le suivi des ventes revendeur
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS commission_amount INTEGER;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Table pour stocker les liens de paiement des revendeurs
CREATE TABLE IF NOT EXISTS reseller_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  stripe_payment_link_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual', 'lifetime')),
  options JSONB DEFAULT '[]',
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour payment links
ALTER TABLE reseller_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_links_select_reseller" ON reseller_payment_links
  FOR SELECT USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

CREATE POLICY "payment_links_insert_reseller" ON reseller_payment_links
  FOR INSERT WITH CHECK (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

CREATE POLICY "payment_links_update_reseller" ON reseller_payment_links
  FOR UPDATE USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );
