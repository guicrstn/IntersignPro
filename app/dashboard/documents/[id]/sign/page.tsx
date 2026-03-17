'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Eraser } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { DOCUMENT_TYPE_LABELS, type DocumentWithDetails } from '@/lib/types'

export default function SignDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [document, setDocument] = useState<DocumentWithDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDocument = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients(*),
          lines:document_lines(*),
          totals:document_totals(*)
        `)
        .eq('id', id)
        .single()

      if (data) {
        setDocument(data as DocumentWithDetails)
      }
    }
    fetchDocument()
  }, [id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleSubmit = async () => {
    if (!signerName.trim()) {
      setError('Veuillez entrer le nom du signataire')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setIsLoading(true)
    setError('')

    try {
      const signatureData = canvas.toDataURL('image/png')
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          signature_data: signatureData,
          signer_name: signerName,
          signed_at: new Date().toISOString(),
          status: 'signed',
        })
        .eq('id', id)

      if (updateError) throw updateError

      router.push(`/dashboard/documents/${id}`)
    } catch (err) {
      console.error('Erreur lors de la signature:', err)
      setError('Erreur lors de la signature')
    } finally {
      setIsLoading(false)
    }
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const typeLabel = DOCUMENT_TYPE_LABELS[document.document_type]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/documents/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Signature - {typeLabel} {document.document_number}
          </h1>
          <p className="text-muted-foreground">Client: {document.client.name}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resume du document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{typeLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Numero</p>
                <p className="font-medium">{document.document_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(document.document_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{document.client.name}</p>
              </div>
            </div>

            {document.totals && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span>{document.totals.total_ttc.toFixed(2)} €</span>
                </div>
              </div>
            )}

            {document.subject && (
              <div className="pt-4 border-t">
                <p className="text-muted-foreground text-sm">Objet</p>
                <p>{document.subject}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Area */}
        <Card>
          <CardHeader>
            <CardTitle>Signature du client</CardTitle>
            <CardDescription>
              Signez dans le cadre ci-dessous pour valider le {typeLabel.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="signerName">Nom du signataire *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Entrez votre nom complet"
              />
            </div>

            <div className="grid gap-2">
              <Label>Signature *</Label>
              <div className="border rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full touch-none cursor-crosshair border border-dashed border-muted-foreground/30 rounded"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <Button variant="outline" size="sm" onClick={clearSignature} className="w-fit">
                <Eraser className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Signature en cours...' : 'Valider la signature'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              En signant ce document, vous acceptez les termes et conditions mentionnes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
