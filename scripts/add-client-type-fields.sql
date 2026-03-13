-- Add client type fields to clients table
-- client_type: 'particulier' or 'professionnel'
-- siret: SIRET number for professionals
-- tva_number: VAT number for professionals

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'particulier' CHECK (client_type IN ('particulier', 'professionnel'));

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS siret TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS tva_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.client_type IS 'Type de client: particulier ou professionnel';
COMMENT ON COLUMN public.clients.siret IS 'Numero SIRET pour les clients professionnels';
COMMENT ON COLUMN public.clients.tva_number IS 'Numero de TVA intracommunautaire pour les clients professionnels';
