import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export type AuditAction = 
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'signed'
  | 'signature_requested'
  | 'converted'
  | 'viewed'
  | 'pdf_generated'
  | 'sent'
  | 'deleted'

export type ActorType = 'user' | 'client' | 'system'

interface AuditLogInput {
  documentId: string
  userId: string
  action: AuditAction
  actionDetails?: Record<string, unknown>
  actorType?: ActorType
  actorName?: string
  actorEmail?: string
  ipAddress?: string
  userAgent?: string
}

interface DocumentForHash {
  id: string
  document_type: string
  document_number: string
  status: string
  document_date: string
  client_id: string
  subject?: string
  notes?: string
  terms?: string
}

interface LineForHash {
  line_order: number
  description: string
  quantity: number
  unit_price_ht: number
  tva_rate: number
  total_ttc: number
}

interface TotalsForHash {
  total_ht: number
  total_tva: number
  total_ttc: number
}

/**
 * Genere un hash SHA-256 d'un contenu quelconque
 */
export async function generateContentHash(content: unknown): Promise<string> {
  const str = JSON.stringify(content)
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Genere un hash SHA-256 du contenu d'un document pour garantir l'integrite
 */
export function generateDocumentHash(
  document: DocumentForHash,
  lines: LineForHash[],
  totals?: TotalsForHash | null
): string {
  // Construire une representation deterministe du document
  const content = {
    document: {
      id: document.id,
      type: document.document_type,
      number: document.document_number,
      status: document.status,
      date: document.document_date,
      client_id: document.client_id,
      subject: document.subject || '',
      notes: document.notes || '',
      terms: document.terms || '',
    },
    lines: lines
      .sort((a, b) => a.line_order - b.line_order)
      .map(line => ({
        order: line.line_order,
        description: line.description,
        quantity: line.quantity,
        price: line.unit_price_ht,
        tva: line.tva_rate,
        total: line.total_ttc,
      })),
    totals: totals ? {
      ht: totals.total_ht,
      tva: totals.total_tva,
      ttc: totals.total_ttc,
    } : null,
  }

  // Generer le hash SHA-256
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(content), 'utf8')
    .digest('hex')

  return hash
}

/**
 * Cree une entree dans le journal d'audit
 */
export async function createAuditLog(input: AuditLogInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Recuperer le document complet pour generer le hash
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', input.documentId)
      .single()

    if (docError || !document) {
      return { success: false, error: 'Document non trouve' }
    }

    // Recuperer les lignes du document
    const { data: lines } = await supabase
      .from('document_lines')
      .select('*')
      .eq('document_id', input.documentId)
      .order('line_order')

    // Recuperer les totaux
    const { data: totals } = await supabase
      .from('document_totals')
      .select('*')
      .eq('document_id', input.documentId)
      .single()

    // Generer le hash d'integrite
    const documentHash = generateDocumentHash(document, lines || [], totals)

    // Inserer le log d'audit
    const { error: insertError } = await supabase
      .from('document_audit_logs')
      .insert({
        document_id: input.documentId,
        user_id: input.userId,
        action: input.action,
        action_details: input.actionDetails || {},
        document_hash: documentHash,
        actor_type: input.actorType || 'user',
        actor_name: input.actorName,
        actor_email: input.actorEmail,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      })

    if (insertError) {
      console.error('Erreur creation audit log:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur audit service:', error)
    return { success: false, error: 'Erreur interne' }
  }
}

/**
 * Cree une version du document (snapshot)
 */
export async function createDocumentVersion(
  documentId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Recuperer le document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return { success: false, error: 'Document non trouve' }
    }

    // Recuperer les lignes
    const { data: lines } = await supabase
      .from('document_lines')
      .select('*')
      .eq('document_id', documentId)
      .order('line_order')

    // Recuperer les totaux
    const { data: totals } = await supabase
      .from('document_totals')
      .select('*')
      .eq('document_id', documentId)
      .single()

    // Calculer le hash
    const contentHash = generateDocumentHash(document, lines || [], totals)

    // Trouver le prochain numero de version
    const { data: lastVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const versionNumber = (lastVersion?.version_number || 0) + 1

    // Creer la version
    const { error: insertError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        user_id: userId,
        version_number: versionNumber,
        document_snapshot: document,
        lines_snapshot: lines || [],
        totals_snapshot: totals,
        content_hash: contentHash,
        reason: reason,
      })

    if (insertError) {
      console.error('Erreur creation version:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, versionNumber }
  } catch (error) {
    console.error('Erreur version service:', error)
    return { success: false, error: 'Erreur interne' }
  }
}

/**
 * Recupere l'historique d'audit d'un document
 */
export async function getDocumentAuditHistory(documentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_audit_logs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur recuperation audit logs:', error)
    return { logs: [], error: error.message }
  }

  return { logs: data || [], error: null }
}

/**
 * Recupere les versions d'un document
 */
export async function getDocumentVersions(documentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Erreur recuperation versions:', error)
    return { versions: [], error: error.message }
  }

  return { versions: data || [], error: null }
}

/**
 * Verifie l'integrite d'un document en comparant le hash actuel avec le dernier hash enregistre
 */
export async function verifyDocumentIntegrity(documentId: string): Promise<{
  isValid: boolean
  currentHash: string
  lastRecordedHash?: string
  error?: string
}> {
  const supabase = await createClient()

  // Recuperer le document actuel
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    return { isValid: false, currentHash: '', error: 'Document non trouve' }
  }

  const { data: lines } = await supabase
    .from('document_lines')
    .select('*')
    .eq('document_id', documentId)
    .order('line_order')

  const { data: totals } = await supabase
    .from('document_totals')
    .select('*')
    .eq('document_id', documentId)
    .single()

  // Calculer le hash actuel
  const currentHash = generateDocumentHash(document, lines || [], totals)

  // Recuperer le dernier log d'audit
  const { data: lastLog } = await supabase
    .from('document_audit_logs')
    .select('document_hash')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!lastLog) {
    return { isValid: true, currentHash, lastRecordedHash: undefined }
  }

  const isValid = currentHash === lastLog.document_hash

  return {
    isValid,
    currentHash,
    lastRecordedHash: lastLog.document_hash,
  }
}
