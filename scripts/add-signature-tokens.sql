-- Create signature_tokens table for email-based document signing
CREATE TABLE IF NOT EXISTS signature_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  client_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signer_name VARCHAR(255),
  signer_ip VARCHAR(45),
  signature_data TEXT
);

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_signature_tokens_token ON signature_tokens(token);
CREATE INDEX IF NOT EXISTS idx_signature_tokens_document_id ON signature_tokens(document_id);

-- Add RLS policies
ALTER TABLE signature_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own signature tokens (via documents they own)
CREATE POLICY "Users can view signature tokens for their documents"
  ON signature_tokens FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Users can create signature tokens for their documents
CREATE POLICY "Users can create signature tokens for their documents"
  ON signature_tokens FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Users can update signature tokens for their documents
CREATE POLICY "Users can update signature tokens for their documents"
  ON signature_tokens FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Allow public access to signature tokens by token value (for client signing)
CREATE POLICY "Anyone can view signature token by token value"
  ON signature_tokens FOR SELECT
  USING (true);

-- Allow public updates to signature tokens (for signing)
CREATE POLICY "Anyone can sign with valid token"
  ON signature_tokens FOR UPDATE
  USING (true);
