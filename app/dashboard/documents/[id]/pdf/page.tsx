'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { pdf } from '@react-pdf/renderer'
import { DocumentPDFDocument } from '@/components/document-pdf-document'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import type { DocumentWithDetails, Company } from '@/lib/types'

export default function DocumentPDFPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [document, setDocument] = useState<DocumentWithDetails | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Get user and company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setCompany(companyData)

      // Load company logo as base64 if exists
      if (companyData?.logo_url) {
        try {
          const logoResponse = await fetch(`/api/logo?pathname=${encodeURIComponent(companyData.logo_url)}`)
          if (logoResponse.ok) {
            const blob = await logoResponse.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              setLogoBase64(reader.result as string)
            }
            reader.readAsDataURL(blob)
          }
        } catch (err) {
          console.error('Error loading logo:', err)
        }
      }

      // Get document with client
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single()

      if (docError || !docData) {
        setError('Document non trouve')
        setIsLoading(false)
        return
      }

      // Get lines
      const { data: linesData } = await supabase
        .from('document_lines')
        .select('*')
        .eq('document_id', id)
        .order('line_order', { ascending: true })

      // Get totals
      const { data: totalsData } = await supabase
        .from('document_totals')
        .select('*')
        .eq('document_id', id)
        .single()

      const fullDocument: DocumentWithDetails = {
        ...docData,
        lines: linesData || [],
        totals: totalsData || null,
      }

      setDocument(fullDocument)
      setIsLoading(false)
    }

    fetchData()
  }, [id, router])

  // Generate PDF when document and logo are ready
  useEffect(() => {
    if (document && company !== undefined && !isLoading) {
      generatePDF()
    }
  }, [document, company, logoBase64, isLoading])

  const generatePDF = async () => {
    if (!document) return
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <DocumentPDFDocument 
          document={document} 
          company={company} 
          logoBase64={logoBase64}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Erreur lors de la generation du PDF')
    }
    setIsGenerating(false)
  }

  const handleDownload = () => {
    if (pdfUrl && document) {
      const link = window.document.createElement('a')
      link.href = pdfUrl
      link.download = `${document.document_number}.pdf`
      link.click()
    }
  }

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error}</p>
        <Button asChild>
          <Link href="/dashboard/documents">Retour aux documents</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/documents/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document?.document_number}</h1>
            <p className="text-muted-foreground">Apercu PDF</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={!pdfUrl || isGenerating}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={handleDownload} disabled={!pdfUrl || isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Telecharger
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="bg-muted rounded-lg p-4">
        {isGenerating ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-muted-foreground">Generation du PDF en cours...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-[800px] rounded-lg border bg-white"
            title="Apercu PDF"
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Impossible de generer l apercu</p>
          </div>
        )}
      </div>
    </div>
  )
}
