-- InterSign Pro - Database Schema
-- Tables: companies, clients, interventions

-- Table companies (informations de la societe de l'utilisateur)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  siret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table interventions
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  intervention_number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'sent')),
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_client_id ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_number ON interventions(intervention_number);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "companies_select_own" ON companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "companies_insert_own" ON companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_delete_own" ON companies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete_own" ON clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for interventions
CREATE POLICY "interventions_select_own" ON interventions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "interventions_insert_own" ON interventions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "interventions_update_own" ON interventions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "interventions_delete_own" ON interventions FOR DELETE USING (auth.uid() = user_id);

-- Function to generate intervention number
CREATE OR REPLACE FUNCTION generate_intervention_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  result TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(intervention_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM interventions
  WHERE user_id = p_user_id
    AND intervention_number LIKE 'INT-' || current_year || '-%';
  
  result := 'INT-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN result;
END;
$$;
