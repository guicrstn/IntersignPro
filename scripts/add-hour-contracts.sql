-- Migration: Add hour contracts system
-- Description: Creates tables for managing hour contracts (tickets) for clients
-- 1 ticket = 1 hour, 0.5 ticket = travel/displacement

-- Create hour_contracts table
CREATE TABLE IF NOT EXISTS public.hour_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Contrat d''heures',
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  remaining_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed')),
  notes TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hour_usage table to track hour deductions
CREATE TABLE IF NOT EXISTS public.hour_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.hour_contracts(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  hours_used NUMERIC(10,2) NOT NULL,
  travel_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hour_contracts_user_id ON public.hour_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_hour_contracts_client_id ON public.hour_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_hour_contracts_status ON public.hour_contracts(status);
CREATE INDEX IF NOT EXISTS idx_hour_usage_contract_id ON public.hour_usage(contract_id);
CREATE INDEX IF NOT EXISTS idx_hour_usage_intervention_id ON public.hour_usage(intervention_id);

-- Enable RLS
ALTER TABLE public.hour_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hour_contracts
CREATE POLICY "hour_contracts_select_own" ON public.hour_contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "hour_contracts_insert_own" ON public.hour_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hour_contracts_update_own" ON public.hour_contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "hour_contracts_delete_own" ON public.hour_contracts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hour_usage
CREATE POLICY "hour_usage_select_own" ON public.hour_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "hour_usage_insert_own" ON public.hour_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hour_usage_update_own" ON public.hour_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "hour_usage_delete_own" ON public.hour_usage
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update remaining hours when usage is added
CREATE OR REPLACE FUNCTION update_contract_remaining_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hour_contracts
    SET remaining_hours = remaining_hours - (NEW.hours_used + NEW.travel_hours),
        updated_at = NOW(),
        status = CASE 
          WHEN remaining_hours - (NEW.hours_used + NEW.travel_hours) <= 0 THEN 'consumed'
          ELSE status
        END
    WHERE id = NEW.contract_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hour_contracts
    SET remaining_hours = remaining_hours + (OLD.hours_used + OLD.travel_hours),
        updated_at = NOW(),
        status = CASE 
          WHEN remaining_hours + (OLD.hours_used + OLD.travel_hours) > 0 AND status = 'consumed' THEN 'active'
          ELSE status
        END
    WHERE id = OLD.contract_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_contract_hours ON public.hour_usage;
CREATE TRIGGER trigger_update_contract_hours
  AFTER INSERT OR DELETE ON public.hour_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_remaining_hours();
