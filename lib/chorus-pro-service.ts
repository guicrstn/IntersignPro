import { createClient } from '@/lib/supabase/server'

// Chorus Pro API endpoints
const CHORUS_PRO_URLS = {
  sandbox: {
    oauth: 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token',
    api: 'https://sandbox-api.piste.gouv.fr/cpro/factures/v1'
  },
  production: {
    oauth: 'https://oauth.piste.gouv.fr/api/oauth/token',
    api: 'https://api.piste.gouv.fr/cpro/factures/v1'
  }
}

interface ChorusProConfig {
  id: string
  user_id: string
  client_id: string | null
  client_secret: string | null
  tech_username: string | null
  tech_password: string | null
  environment: 'sandbox' | 'production'
  is_enabled: boolean
  siret: string | null
}

interface ChorusProInvoice {
  // Structure simplifiée pour l'envoi de facture
  numeroFacture: string
  dateFacture: string
  dateEcheance: string
  montantHT: number
  montantTVA: number
  montantTTC: number
  siretFournisseur: string
  siretClient: string
  codeServiceExecutant?: string
  lignes: {
    description: string
    quantite: number
    prixUnitaire: number
    tauxTVA: number
  }[]
}

export class ChorusProService {
  private config: ChorusProConfig | null = null
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  async initialize(userId: string): Promise<boolean> {
    const supabase = await createClient()
    
    const { data: config } = await supabase
      .from('chorus_pro_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!config || !config.is_enabled) {
      return false
    }

    this.config = config as ChorusProConfig
    return true
  }

  isConfigured(): boolean {
    return !!(
      this.config?.client_id &&
      this.config?.client_secret &&
      this.config?.tech_username &&
      this.config?.tech_password &&
      this.config?.siret
    )
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.config) return null

    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }

    const env = this.config.environment
    const tokenUrl = CHORUS_PRO_URLS[env].oauth

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.client_id!,
          client_secret: this.config.client_secret!,
          scope: 'openid'
        })
      })

      if (!response.ok) {
        console.error('Chorus Pro OAuth error:', await response.text())
        return null
      }

      const data = await response.json()
      this.accessToken = data.access_token
      // Token expires in 1 hour, refresh 5 minutes before
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000)

      return this.accessToken
    } catch (error) {
      console.error('Chorus Pro OAuth error:', error)
      return null
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Configuration incomplete' }
    }

    const token = await this.getAccessToken()
    if (!token) {
      return { success: false, message: 'Impossible d\'obtenir le token d\'acces. Verifiez vos identifiants PISTE.' }
    }

    // Test avec un appel simple pour vérifier les credentials
    const env = this.config!.environment
    const apiUrl = CHORUS_PRO_URLS[env].api

    try {
      const response = await fetch(`${apiUrl}/structures/rechercher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'cpro-account': `${this.config!.tech_username}:${this.config!.tech_password}`
        },
        body: JSON.stringify({
          parametres: {
            nbResultatsParPage: 1,
            pageResultatDemandee: 1
          },
          identifiantStructure: this.config!.siret
        })
      })

      if (response.ok) {
        return { success: true, message: 'Connexion reussie a Chorus Pro' }
      } else {
        const error = await response.text()
        return { success: false, message: `Erreur Chorus Pro: ${error}` }
      }
    } catch (error) {
      return { success: false, message: `Erreur de connexion: ${error}` }
    }
  }

  async submitInvoice(invoice: ChorusProInvoice, documentId: string): Promise<{ 
    success: boolean
    invoiceId?: string
    message: string 
  }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Chorus Pro non configure' }
    }

    const token = await this.getAccessToken()
    if (!token) {
      return { success: false, message: 'Impossible d\'obtenir le token d\'acces' }
    }

    const env = this.config!.environment
    const apiUrl = CHORUS_PRO_URLS[env].api

    try {
      // Format pour Factur-X / Chorus Pro
      const facture = {
        cadreDeFacturation: {
          codeCadreFacturation: 'A1_FACTURE_FOURNISSEUR',
          codeServiceValideur: invoice.codeServiceExecutant || null
        },
        identifiantFacture: {
          numeroFacture: invoice.numeroFacture,
          dateFacture: invoice.dateFacture
        },
        fournisseur: {
          identifiant: invoice.siretFournisseur,
          typeIdentifiant: 'SIRET'
        },
        destinataire: {
          identifiant: invoice.siretClient,
          typeIdentifiant: 'SIRET'
        },
        montant: {
          montantHT: invoice.montantHT,
          montantTVA: invoice.montantTVA,
          montantTTC: invoice.montantTTC,
          deviseFacture: 'EUR'
        },
        dateEcheancePaiement: invoice.dateEcheance,
        lignesPoste: invoice.lignes.map((ligne, index) => ({
          numeroLignePoste: index + 1,
          designation: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          tauxTva: ligne.tauxTVA,
          montantHT: ligne.quantite * ligne.prixUnitaire
        }))
      }

      const response = await fetch(`${apiUrl}/factures/soumettre`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'cpro-account': `${this.config!.tech_username}:${this.config!.tech_password}`
        },
        body: JSON.stringify(facture)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update document with Chorus Pro info
        const supabase = await createClient()
        await supabase
          .from('documents')
          .update({
            chorus_pro_invoice_id: result.identifiantFactureCPP,
            chorus_pro_status: 'submitted',
            chorus_pro_sent_at: new Date().toISOString()
          })
          .eq('id', documentId)

        return { 
          success: true, 
          invoiceId: result.identifiantFactureCPP,
          message: 'Facture envoyee a Chorus Pro avec succes' 
        }
      } else {
        const error = await response.json()
        return { 
          success: false, 
          message: `Erreur Chorus Pro: ${error.message || JSON.stringify(error)}` 
        }
      }
    } catch (error) {
      return { success: false, message: `Erreur lors de l'envoi: ${error}` }
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<{ status: string; message: string } | null> {
    if (!this.isConfigured()) return null

    const token = await this.getAccessToken()
    if (!token) return null

    const env = this.config!.environment
    const apiUrl = CHORUS_PRO_URLS[env].api

    try {
      const response = await fetch(`${apiUrl}/factures/consulter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'cpro-account': `${this.config!.tech_username}:${this.config!.tech_password}`
        },
        body: JSON.stringify({
          identifiantFactureCPP: invoiceId
        })
      })

      if (response.ok) {
        const result = await response.json()
        return {
          status: result.statutFacture,
          message: result.libelleStatutFacture
        }
      }
    } catch (error) {
      console.error('Error getting invoice status:', error)
    }

    return null
  }
}

// Helper to check if user has Chorus Pro configured
export async function isChorusProEnabled(userId: string): Promise<boolean> {
  const service = new ChorusProService()
  const initialized = await service.initialize(userId)
  return initialized && service.isConfigured()
}
