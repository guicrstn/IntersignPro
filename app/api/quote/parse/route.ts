import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pdf from 'pdf-parse'

export interface QuoteLine {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Parse extracted text to find quote lines
function extractQuoteLines(text: string): QuoteLine[] {
  const lines: QuoteLine[] = []
  
  // Split text into lines
  const textLines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Common patterns for quote lines:
  // Pattern 1: "Description    Qty    Unit Price    Total"
  // Pattern 2: "1. Description - 2 x 50.00€ = 100.00€"
  // Pattern 3: Lines with numbers that look like quantities and prices
  
  const pricePattern = /(\d+[.,]?\d*)\s*€/g
  const quantityPattern = /(\d+)\s*(x|pcs?|unit[ée]?s?|heure?s?|jour?s?|h|j)/gi
  
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i]
    
    // Skip headers and footers
    if (line.toLowerCase().includes('total') && line.toLowerCase().includes('ttc')) continue
    if (line.toLowerCase().includes('sous-total')) continue
    if (line.toLowerCase().includes('tva')) continue
    if (line.length < 5) continue
    
    // Find prices in the line
    const prices: number[] = []
    let match
    while ((match = pricePattern.exec(line)) !== null) {
      prices.push(parseFloat(match[1].replace(',', '.')))
    }
    pricePattern.lastIndex = 0
    
    // Find quantities
    let quantity = 1
    const qtyMatch = quantityPattern.exec(line)
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1])
    }
    quantityPattern.lastIndex = 0
    
    // If we found prices, this might be a quote line
    if (prices.length >= 1) {
      // Extract description (text before the first number)
      const descMatch = line.match(/^([^0-9€]+)/)
      let description = descMatch ? descMatch[1].trim() : line
      
      // Clean up description
      description = description
        .replace(/[-–—]\s*$/, '')
        .replace(/^\d+[.)]\s*/, '')
        .trim()
      
      if (description.length > 2) {
        const total = prices[prices.length - 1]
        const unitPrice = prices.length > 1 ? prices[0] : total / quantity
        
        lines.push({
          description,
          quantity,
          unitPrice: Math.round(unitPrice * 100) / 100,
          total: Math.round(total * 100) / 100,
        })
      }
    }
  }
  
  return lines
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }
    
    // Check if user has quote_import option enabled
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (company) {
      // Check license options
      const { data: license } = await supabase
        .from('licenses')
        .select('id, license_options(option_key)')
        .eq('company_id', company.id)
        .single()
      
      if (license) {
        const hasQuoteOption = license.license_options?.some(
          (opt: { option_key: string }) => opt.option_key === 'quote_import'
        )
        
        if (!hasQuoteOption) {
          return NextResponse.json(
            { error: 'Option import de devis non activee pour cette licence' },
            { status: 403 }
          )
        }
      }
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Le fichier doit etre un PDF' }, { status: 400 })
    }
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse PDF
    const pdfData = await pdf(buffer)
    const text = pdfData.text
    
    // Extract quote lines
    const lines = extractQuoteLines(text)
    
    return NextResponse.json({
      success: true,
      text: text.substring(0, 2000), // Return first 2000 chars for preview
      lines,
      pageCount: pdfData.numpages,
    })
    
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du PDF' },
      { status: 500 }
    )
  }
}
