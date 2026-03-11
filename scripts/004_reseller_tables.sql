-- Table des revendeurs
CREATE TABLE IF NOT EXISTS resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des options disponibles
CREATE TABLE IF NOT EXISTS license_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_annual INTEGER NOT NULL,
  price_lifetime INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des licences
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual', 'lifetime')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  options JSONB DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter reference licence dans companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES licenses(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN DEFAULT false;

-- Inserer les options par defaut
INSERT INTO license_options (code, name, description, price_monthly, price_annual, price_lifetime) VALUES
  ('quote_import', 'Import Devis', 'Importez vos devis PDF et extrayez automatiquement les lignes pour les ajouter aux bons d''intervention', 1000, 10000, 15000)
ON CONFLICT (code) DO NOTHING;

-- RLS pour resellers
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resellers_select_own" ON resellers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "resellers_insert_own" ON resellers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resellers_update_own" ON resellers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS pour licenses (revendeurs peuvent voir leurs licences)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licenses_select_reseller" ON licenses
  FOR SELECT USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
    OR company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "licenses_insert_reseller" ON licenses
  FOR INSERT WITH CHECK (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

CREATE POLICY "licenses_update_reseller" ON licenses
  FOR UPDATE USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

-- RLS pour license_options (lecture publique)
ALTER TABLE license_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "license_options_select_all" ON license_options
  FOR SELECT USING (true);
