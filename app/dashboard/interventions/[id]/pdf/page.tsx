'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { InterventionWithClient, Company } from '@/lib/types'

export default function PDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isFetching, setIsFetching] = useState(true)
  const [intervention, setIntervention] = useState<InterventionWithClient | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [PDFReady, setPDFReady] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<{
    PDFDownloadLink: React.ComponentType<any>
    InterventionPDFDocument: React.ComponentType<any>
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: interventionData } = await supabase
          .from('interventions')
          .select('*, client:clients(*)')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setIntervention(interventionData)
        // Construire l'URL complete du logo pour le PDF
        if (companyData?.logo_url) {
          const logoUrl = `/api/logo?pathname=${encodeURIComponent(companyData.logo_url)}`
          // Pour react-pdf, on a besoin d'une URL absolue
          const baseUrl = window.location.origin
          companyData.logo_url = `${baseUrl}${logoUrl}`
        }
        setCompany(companyData)
      }
      setIsFetching(false)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    // Load PDF components dynamically on client side only
    const loadPDFComponents = async () => {
      const [reactPdf, pdfDoc] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/intervention-pdf-document')
      ])
      setPDFComponents({
        PDFDownloadLink: reactPdf.PDFDownloadLink,
        InterventionPDFDocument: pdfDoc.InterventionPDFDocument
      })
      setPDFReady(true)
    }
    loadPDFComponents()
  }, [])

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Intervention non trouvee</p>
      </div>
    )
  }

  if (intervention.status !== 'signed') {
    router.push(`/dashboard/interventions/${id}`)
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/interventions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Telecharger PDF</h1>
          <p className="text-muted-foreground">{intervention.intervention_number}</p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Bon d&apos;intervention pret
            </h2>
            <p className="text-muted-foreground mt-2">
              Cliquez sur le bouton ci-dessous pour telecharger le bon d&apos;intervention
              au format PDF avec la signature du client.
            </p>
          </div>

          <div className="space-y-4">
            {PDFReady && PDFComponents ? (
              <PDFComponents.PDFDownloadLink
                document={<PDFComponents.InterventionPDFDocument intervention={intervention} company={company} />}
                fileName={`${intervention.intervention_number}.pdf`}
              >
                {({ loading }: { loading: boolean }) => (
                  <Button size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generation...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Telecharger le PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFComponents.PDFDownloadLink>
            ) : (
              <Button size="lg" className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </Button>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href={`/dashboard/interventions/${id}`}>
                Retour au bon
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Le PDF contient toutes les informations de l&apos;intervention ainsi que
            la signature du client.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
