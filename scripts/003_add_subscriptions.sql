-- Add subscription and trial fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- subscription_status can be: 'trial', 'active', 'expired', 'cancelled'
-- subscription_plan can be: 'monthly', 'annual', 'lifetime'
