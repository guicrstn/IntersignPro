-- Add quote_lines column to interventions table
-- This stores the extracted lines from imported quotes

ALTER TABLE interventions ADD COLUMN IF NOT EXISTS quote_lines JSONB DEFAULT NULL;

-- Add quote_pdf_url to store the original PDF
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS quote_pdf_url TEXT DEFAULT NULL;

-- Add quote_imported_at timestamp
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS quote_imported_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for interventions with quotes
CREATE INDEX IF NOT EXISTS idx_interventions_quote_imported 
ON interventions(quote_imported_at) 
WHERE quote_imported_at IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN interventions.quote_lines IS 'JSON array of quote line items extracted from PDF';
COMMENT ON COLUMN interventions.quote_pdf_url IS 'URL to the original quote PDF file';
COMMENT ON COLUMN interventions.quote_imported_at IS 'Timestamp when quote was imported';
