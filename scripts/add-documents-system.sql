-- Documents System Migration
-- Unified table for all document types: quotes (devis), orders (commandes), 
-- deliveries (livraisons), invoices (factures)

-- Document types enum approach via check constraint
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Document identification
  document_type TEXT NOT NULL CHECK (document_type IN ('devis', 'commande', 'livraison', 'facture')),
  document_number TEXT NOT NULL,
  
  -- Workflow: devis -> commande -> livraison/prestation -> facture
  parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'converted', 'cancelled')),
  
  -- Dates
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  validity_date DATE, -- For quotes: date until quote is valid
  due_date DATE, -- For invoices: payment due date
  
  -- Subject/notes
  subject TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Terms and conditions
  terms TEXT,
  
  -- Payment info (for invoices)
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  
  -- Signature data
  signature_data TEXT,
  signer_name TEXT,
  signed_at TIMESTAMPTZ,
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document lines with TVA support
CREATE TABLE IF NOT EXISTS public.document_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Line details
  line_order INTEGER NOT NULL DEFAULT 0,
  line_type TEXT NOT NULL DEFAULT 'service' CHECK (line_type IN ('service', 'product', 'discount', 'shipping')),
  
  -- Description
  reference TEXT,
  description TEXT NOT NULL,
  
  -- Quantities and pricing
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unite', -- unite, heure, jour, forfait, etc.
  unit_price_ht DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Discount per line
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- TVA
  tva_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00, -- 20%, 10%, 5.5%, 2.1%
  
  -- Computed totals (stored for performance)
  total_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_tva DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document totals summary (stored for performance)
CREATE TABLE IF NOT EXISTS public.document_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Subtotals
  total_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_discount DECIMAL(12, 2) DEFAULT 0,
  total_ht_after_discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- TVA breakdown by rate
  tva_20 DECIMAL(12, 2) DEFAULT 0,
  tva_10 DECIMAL(12, 2) DEFAULT 0,
  tva_5_5 DECIMAL(12, 2) DEFAULT 0,
  tva_2_1 DECIMAL(12, 2) DEFAULT 0,
  total_tva DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Final total
  total_ttc DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence tracking for document numbers
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  prefix TEXT NOT NULL DEFAULT '',
  current_number INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  UNIQUE(user_id, document_type, year)
);

-- RLS Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents" 
  ON public.documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
  ON public.documents FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
  ON public.documents FOR DELETE 
  USING (auth.uid() = user_id);

-- Document lines policies
CREATE POLICY "Users can view their own document lines" 
  ON public.document_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can insert their own document lines" 
  ON public.document_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can update their own document lines" 
  ON public.document_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can delete their own document lines" 
  ON public.document_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));

-- Document totals policies
CREATE POLICY "Users can view their own document totals" 
  ON public.document_totals FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_totals.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can manage their own document totals" 
  ON public.document_totals FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_totals.document_id AND documents.user_id = auth.uid()));

-- Sequences policies
CREATE POLICY "Users can view their own sequences" 
  ON public.document_sequences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sequences" 
  ON public.document_sequences FOR ALL 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON public.documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_lines_document_id ON public.document_lines(document_id);

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number(p_user_id UUID, p_document_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_year INTEGER;
  v_result TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Set prefix based on document type
  CASE p_document_type
    WHEN 'devis' THEN v_prefix := 'DEV';
    WHEN 'commande' THEN v_prefix := 'CMD';
    WHEN 'livraison' THEN v_prefix := 'LIV';
    WHEN 'facture' THEN v_prefix := 'FAC';
    ELSE v_prefix := 'DOC';
  END CASE;
  
  -- Get or create sequence
  INSERT INTO public.document_sequences (user_id, document_type, prefix, current_number, year)
  VALUES (p_user_id, p_document_type, v_prefix, 1, v_year)
  ON CONFLICT (user_id, document_type, year)
  DO UPDATE SET current_number = document_sequences.current_number + 1
  RETURNING current_number INTO v_number;
  
  -- Format: PREFIX-YYYY-NNNN
  v_result := v_prefix || '-' || v_year || '-' || LPAD(v_number::TEXT, 4, '0');
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update document totals
CREATE OR REPLACE FUNCTION update_document_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht DECIMAL(12, 2);
  v_tva_20 DECIMAL(12, 2);
  v_tva_10 DECIMAL(12, 2);
  v_tva_5_5 DECIMAL(12, 2);
  v_tva_2_1 DECIMAL(12, 2);
  v_total_tva DECIMAL(12, 2);
  v_total_ttc DECIMAL(12, 2);
  v_doc_id UUID;
BEGIN
  -- Get the document_id
  IF TG_OP = 'DELETE' THEN
    v_doc_id := OLD.document_id;
  ELSE
    v_doc_id := NEW.document_id;
  END IF;
  
  -- Calculate totals from lines
  SELECT 
    COALESCE(SUM(total_ht), 0),
    COALESCE(SUM(CASE WHEN tva_rate = 20 THEN total_tva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tva_rate = 10 THEN total_tva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tva_rate = 5.5 THEN total_tva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tva_rate = 2.1 THEN total_tva ELSE 0 END), 0),
    COALESCE(SUM(total_tva), 0),
    COALESCE(SUM(total_ttc), 0)
  INTO v_total_ht, v_tva_20, v_tva_10, v_tva_5_5, v_tva_2_1, v_total_tva, v_total_ttc
  FROM public.document_lines
  WHERE document_id = v_doc_id;
  
  -- Upsert totals
  INSERT INTO public.document_totals (document_id, total_ht, total_ht_after_discount, tva_20, tva_10, tva_5_5, tva_2_1, total_tva, total_ttc)
  VALUES (v_doc_id, v_total_ht, v_total_ht, v_tva_20, v_tva_10, v_tva_5_5, v_tva_2_1, v_total_tva, v_total_ttc)
  ON CONFLICT (document_id)
  DO UPDATE SET 
    total_ht = v_total_ht,
    total_ht_after_discount = v_total_ht,
    tva_20 = v_tva_20,
    tva_10 = v_tva_10,
    tva_5_5 = v_tva_5_5,
    tva_2_1 = v_tva_2_1,
    total_tva = v_total_tva,
    total_ttc = v_total_ttc,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_document_totals ON public.document_lines;
CREATE TRIGGER trigger_update_document_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.document_lines
  FOR EACH ROW EXECUTE FUNCTION update_document_totals();

-- Trigger to calculate line totals before insert/update
CREATE OR REPLACE FUNCTION calculate_line_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_ht: (quantity * unit_price_ht) - discounts
  NEW.total_ht := (NEW.quantity * NEW.unit_price_ht) - NEW.discount_amount - ((NEW.quantity * NEW.unit_price_ht) * NEW.discount_percent / 100);
  
  -- Calculate TVA
  NEW.total_tva := NEW.total_ht * NEW.tva_rate / 100;
  
  -- Calculate TTC
  NEW.total_ttc := NEW.total_ht + NEW.total_tva;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_line_totals ON public.document_lines;
CREATE TRIGGER trigger_calculate_line_totals
  BEFORE INSERT OR UPDATE ON public.document_lines
  FOR EACH ROW EXECUTE FUNCTION calculate_line_totals();
