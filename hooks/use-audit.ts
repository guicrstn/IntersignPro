'use client'

import { useCallback } from 'react'

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

interface LogAuditOptions {
  documentId: string
  action: AuditAction
  actionDetails?: Record<string, unknown>
  createVersion?: boolean
  versionReason?: string
}

export function useAudit() {
  const logAudit = useCallback(async (options: LogAuditOptions) => {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Erreur audit:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur audit:', error)
      return false
    }
  }, [])

  const getAuditHistory = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/audit?documentId=${documentId}`)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Erreur recuperation audit:', error)
        return { logs: [], versions: [] }
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur recuperation audit:', error)
      return { logs: [], versions: [] }
    }
  }, [])

  return { logAudit, getAuditHistory }
}
