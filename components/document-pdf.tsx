'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DocumentPDFProps {
  documentId: string
}

export function DocumentPDF({ documentId }: DocumentPDFProps) {
  const handleDownload = () => {
    // For now, just open the document detail page with print option
    window.print()
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Telecharger PDF
    </Button>
  )
}
