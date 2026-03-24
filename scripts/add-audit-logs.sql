-- Table pour la piste d'audit reglementaire (tracabilite des documents)
-- Conforme aux exigences legales francaises pour les documents commerciaux

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference au document
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type d'action
  action TEXT NOT NULL CHECK (action IN (
    'created',           -- Document cree
    'updated',           -- Document modifie
    'status_changed',    -- Statut modifie
    'signed',            -- Document signe
    'signature_requested', -- Demande de signature envoyee
    'converted',         -- Converti en autre type
    'viewed',            -- Document consulte
    'pdf_generated',     -- PDF genere
    'sent',              -- Envoye par email
    'deleted'            -- Supprime
  )),
  
  -- Details de l'action
  action_details JSONB DEFAULT '{}',  -- Details specifiques (champs modifies, ancien/nouveau statut, etc.)
  
  -- Hash d'integrite du document au moment de l'action
  document_hash TEXT NOT NULL,  -- SHA-256 du contenu du document
  
  -- Informations sur l'acteur
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'client', 'system')),
  actor_name TEXT,  -- Nom de la personne qui a effectue l'action
  actor_email TEXT, -- Email de la personne
  
  -- Informations techniques
  ip_address TEXT,
  user_agent TEXT,
  
  -- Horodatage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index pour les recherches
  CONSTRAINT valid_action CHECK (action IS NOT NULL)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON document_audit_logs(created_at);

-- RLS Policies
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les logs de leurs propres documents
CREATE POLICY "Users can view audit logs for their documents"
  ON document_audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent creer des logs pour leurs propres documents
CREATE POLICY "Users can create audit logs for their documents"
  ON document_audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Les logs ne peuvent pas etre modifies ou supprimes (immutables pour l'audit)
-- Pas de policy UPDATE ou DELETE = impossible de modifier/supprimer

-- Table pour stocker les versions de documents (pour pouvoir reconstruire l'historique)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Snapshot complet du document a ce moment
  document_snapshot JSONB NOT NULL,
  lines_snapshot JSONB NOT NULL,
  totals_snapshot JSONB,
  
  -- Hash d'integrite
  content_hash TEXT NOT NULL,
  
  -- Raison de la version
  reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, version_number)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their documents"
  ON document_versions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create versions of their documents"
  ON document_versions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Pas de UPDATE ou DELETE pour l'immutabilite
