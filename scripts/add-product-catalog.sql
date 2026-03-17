-- Product catalog table for reusable products and services
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product info
  reference VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Type: product (materiel) or service (prestation)
  product_type VARCHAR(20) NOT NULL DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  
  -- Pricing
  unit_price_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tva_rate DECIMAL(4, 2) NOT NULL DEFAULT 20,
  unit VARCHAR(20) DEFAULT 'unite',
  
  -- Stock (optional, for products)
  track_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 5,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_catalog_user_id ON public.product_catalog(user_id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_reference ON public.product_catalog(reference);

-- Enable RLS
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own products" ON public.product_catalog;
CREATE POLICY "Users can view their own products"
  ON public.product_catalog FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own products" ON public.product_catalog;
CREATE POLICY "Users can create their own products"
  ON public.product_catalog FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own products" ON public.product_catalog;
CREATE POLICY "Users can update their own products"
  ON public.product_catalog FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own products" ON public.product_catalog;
CREATE POLICY "Users can delete their own products"
  ON public.product_catalog FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_catalog_updated_at ON public.product_catalog;
CREATE TRIGGER trigger_update_product_catalog_updated_at
  BEFORE UPDATE ON public.product_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_product_catalog_updated_at();
