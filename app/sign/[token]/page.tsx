'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SignatureCanvas } from '@/components/signature-canvas'
import { FileSignature, CheckCircle, XCircle, Clock, Loader2, FileText } from 'lucide-react'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  devis: 'Devis',
  commande: 'Bon de commande',
  livraison: 'Bon de livraison',
  facture: 'Facture',
}

interface DocumentData {
  id: string
  document_number: string
  document_type: string
  document_date: string
  subject: string | null
  notes: string | null
  terms: string | null
  status: string
  client: {
    name: string
    email: string
    address: string | null
    city: string | null
    postal_code: string | null
  }
  lines: Array<{
    id: string
    description: string
    quantity: number
    unit: string
    unit_price_ht: number
    tva_rate: number
    total_ht: number
    total_ttc: number
  }>
  totals: {
    total_ht: number
    total_tva: number
    total_ttc: number
  } | null
  company: {
    name: string
    address: string | null
    city: string | null
    postal_code: string | null
    phone: string | null
    email: string | null
    siret: string | null
  } | null
}

interface TokenData {
  id: string
  expires_at: string
  used_at: string | null
  signed_at: string | null
}

export default function SignDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/sign/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Erreur lors du chargement')
          setIsLoading(false)
          return
        }

        setDocument(data.document)
        setTokenData(data.token)
        setSignerName(data.document.client.name)
      } catch (err) {
        setError('Erreur de connexion')
      }
      setIsLoading(false)
    }

    fetchDocument()
  }, [token])

  const handleSign = async () => {
    if (!signatureData) {
      setError('Veuillez signer le document')
      return
    }

    if (!signerName.trim()) {
      setError('Veuillez entrer votre nom')
      return
    }

    setIsSigning(true)
    setError(null)

    try {
      const response = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la signature')
        setIsSigning(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Erreur de connexion')
    }
    setIsSigning(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-semibold mb-2">Lien invalide ou expire</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Document signe avec succes !</h1>
            <p className="text-muted-foreground">
              Merci d'avoir signe le {DOCUMENT_TYPE_LABELS[document?.document_type || '']?.toLowerCase() || 'document'} {document?.document_number}.
            </p>
            <p className="text-muted-foreground mt-2">
              Vous pouvez fermer cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenData?.signed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Document deja signe</h1>
            <p className="text-muted-foreground">
              Ce document a deja ete signe le {new Date(tokenData.signed_at).toLocaleDateString('fr-FR')}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <FileSignature className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-semibold">InterSign Pro</h1>
              <p className="text-sm opacity-90">Signature electronique</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Document Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {DOCUMENT_TYPE_LABELS[document?.document_type || '']} {document?.document_number}
                </CardTitle>
                <CardDescription>
                  Emis le {new Date(document?.document_date || '').toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                En attente de signature
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Emetteur</h3>
                <p className="font-semibold">{document?.company?.name}</p>
                {document?.company?.address && <p className="text-sm">{document.company.address}</p>}
                {document?.company?.postal_code && document?.company?.city && (
                  <p className="text-sm">{document.company.postal_code} {document.company.city}</p>
                )}
                {document?.company?.siret && (
                  <p className="text-sm text-muted-foreground">SIRET: {document.company.siret}</p>
                )}
              </div>

              {/* Client */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Destinataire</h3>
                <p className="font-semibold">{document?.client.name}</p>
                {document?.client.address && <p className="text-sm">{document.client.address}</p>}
                {document?.client.postal_code && document?.client.city && (
                  <p className="text-sm">{document.client.postal_code} {document.client.city}</p>
                )}
              </div>
            </div>

            {document?.subject && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Objet</h3>
                <p>{document.subject}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lines */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium">Qte</th>
                    <th className="text-right py-2 font-medium">P.U. HT</th>
                    <th className="text-right py-2 font-medium">TVA</th>
                    <th className="text-right py-2 font-medium">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {document?.lines.map((line) => (
                    <tr key={line.id} className="border-b">
                      <td className="py-3">{line.description}</td>
                      <td className="text-right py-3">{line.quantity} {line.unit}</td>
                      <td className="text-right py-3">{line.unit_price_ht.toFixed(2)} €</td>
                      <td className="text-right py-3">{line.tva_rate}%</td>
                      <td className="text-right py-3 font-medium">{line.total_ttc.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            {document?.totals && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total HT</span>
                    <span>{document.totals.total_ht.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total TVA</span>
                    <span>{document.totals.total_tva.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-primary">{document.totals.total_ttc.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        {document?.terms && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{document.terms}</p>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Signer le document
            </CardTitle>
            <CardDescription>
              En signant ce document, vous acceptez les termes et conditions ci-dessus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="signerName">Votre nom complet *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Entrez votre nom"
              />
            </div>

            <div className="grid gap-2">
              <Label>Votre signature *</Label>
              <div className="border rounded-lg p-4 bg-white">
                <SignatureCanvas
                  onSignatureChange={setSignatureData}
                  width={400}
                  height={200}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Dessinez votre signature dans le cadre ci-dessus
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button 
              onClick={handleSign} 
              className="w-full" 
              size="lg"
              disabled={isSigning || !signatureData || !signerName.trim()}
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Signer le document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by InterSign Pro - Signature electronique securisee
        </p>
      </main>
    </div>
  )
}
