/**
 * @jest-environment node
 */
import { generateDocumentHash, generateContentHash } from '@/lib/audit-service'

describe('Audit Service', () => {
  describe('generateContentHash', () => {
    it('generates consistent hash for same content', async () => {
      const content = { test: 'data', value: 123 }
      const hash1 = await generateContentHash(content)
      const hash2 = await generateContentHash(content)
      
      expect(hash1).toBe(hash2)
    })

    it('generates different hash for different content', async () => {
      const content1 = { test: 'data1' }
      const content2 = { test: 'data2' }
      
      const hash1 = await generateContentHash(content1)
      const hash2 = await generateContentHash(content2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('returns a valid SHA-256 hash format', async () => {
      const content = { test: 'data' }
      const hash = await generateContentHash(content)
      
      // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('generateDocumentHash', () => {
    const mockDocument = {
      id: '123',
      document_type: 'devis',
      document_number: 'DEV-2024-001',
      status: 'draft',
      document_date: '2024-01-15',
      client_id: 'client-123',
      subject: 'Test devis',
      notes: '',
      terms: '',
    }

    const mockLines = [
      {
        line_order: 0,
        description: 'Service A',
        quantity: 1,
        unit_price_ht: 100,
        tva_rate: 20,
        total_ttc: 120,
      },
    ]

    const mockTotals = {
      total_ht: 100,
      total_tva: 20,
      total_ttc: 120,
    }

    it('generates hash from document data', () => {
      const hash = generateDocumentHash(mockDocument, mockLines, mockTotals)
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('generates consistent hash for same document', () => {
      const hash1 = generateDocumentHash(mockDocument, mockLines, mockTotals)
      const hash2 = generateDocumentHash(mockDocument, mockLines, mockTotals)
      
      expect(hash1).toBe(hash2)
    })

    it('generates different hash when document changes', () => {
      const hash1 = generateDocumentHash(mockDocument, mockLines, mockTotals)
      
      const modifiedDocument = { ...mockDocument, status: 'signed' }
      const hash2 = generateDocumentHash(modifiedDocument, mockLines, mockTotals)
      
      expect(hash1).not.toBe(hash2)
    })

    it('generates different hash when lines change', () => {
      const hash1 = generateDocumentHash(mockDocument, mockLines, mockTotals)
      
      const modifiedLines = [
        { ...mockLines[0], quantity: 2 },
      ]
      const hash2 = generateDocumentHash(mockDocument, modifiedLines, mockTotals)
      
      expect(hash1).not.toBe(hash2)
    })
  })
})
