'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Link from 'next/link'

interface DocumentPDFProps {
  documentId: string
}

export function DocumentPDF({ documentId }: DocumentPDFProps) {
  return (
    <Button variant="outline" asChild>
      <Link href={`/dashboard/documents/${documentId}/pdf`}>
        <Download className="mr-2 h-4 w-4" />
        Telecharger PDF
      </Link>
    </Button>
  )
}
