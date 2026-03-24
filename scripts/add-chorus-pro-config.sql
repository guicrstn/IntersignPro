-- Add Chorus Pro configuration table for users
-- Each user can configure their own Chorus Pro credentials

CREATE TABLE IF NOT EXISTS chorus_pro_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Credentials from PISTE
  client_id TEXT,
  client_secret TEXT,
  
  -- Technical account from Chorus Pro
  tech_username TEXT,
  tech_password TEXT,
  
  -- Configuration
  environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Company info for Chorus Pro
  siret TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE chorus_pro_config ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own config
CREATE POLICY "Users can view own chorus config" ON chorus_pro_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chorus config" ON chorus_pro_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chorus config" ON chorus_pro_config
  FOR UPDATE USING (auth.uid() = user_id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_chorus_pro_config_user ON chorus_pro_config(user_id);

-- Add chorus_pro_invoice_id to documents for tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chorus_pro_invoice_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chorus_pro_status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chorus_pro_sent_at TIMESTAMP WITH TIME ZONE;
