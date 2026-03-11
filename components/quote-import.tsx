'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  Trash2,
  Plus,
  Edit2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuoteLine {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuoteImportProps {
  onImport: (lines: QuoteLine[]) => void
  existingLines?: QuoteLine[]
  disabled?: boolean
}

export function QuoteImport({ onImport, existingLines = [], disabled = false }: QuoteImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<QuoteLine[]>(existingLines)
  const [isDragging, setIsDragging] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<QuoteLine>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  })

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Veuillez selectionner un fichier PDF')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/quote/parse', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }

      if (data.lines && data.lines.length > 0) {
        setLines(data.lines)
      } else {
        setError('Aucune ligne de devis detectee dans ce PDF. Vous pouvez ajouter les lignes manuellement.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditForm(lines[index])
  }

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newLines = [...lines]
      newLines[editingIndex] = {
        ...editForm,
        total: editForm.quantity * editForm.unitPrice,
      }
      setLines(newLines)
      setEditingIndex(null)
    }
  }

  const addNewLine = () => {
    setLines(prev => [...prev, {
      description: 'Nouvelle ligne',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }])
    setEditingIndex(lines.length)
    setEditForm({
      description: 'Nouvelle ligne',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    })
  }

  const handleConfirm = () => {
    onImport(lines)
    setIsOpen(false)
  }

  const totalAmount = lines.reduce((sum, line) => sum + line.total, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Upload className="h-4 w-4 mr-2" />
          Importer un devis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import de devis
          </DialogTitle>
          <DialogDescription>
            Importez un devis PDF pour extraire automatiquement les lignes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border',
              isLoading && 'opacity-50 pointer-events-none'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Analyse du PDF en cours...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Glissez-deposez un fichier PDF ici
                </p>
                <p className="text-xs text-muted-foreground mb-4">ou</p>
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
                    Parcourir
                  </span>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Lines table */}
          {lines.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lignes extraites</CardTitle>
                  <Button variant="outline" size="sm" onClick={addNewLine}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <CardDescription>
                  {lines.length} ligne{lines.length > 1 ? 's' : ''} - Total: {totalAmount.toFixed(2)}€
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20 text-right">Qte</TableHead>
                      <TableHead className="w-28 text-right">Prix unit.</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        {editingIndex === index ? (
                          <>
                            <TableCell>
                              <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                                className="h-8 w-16 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.unitPrice}
                                onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })}
                                className="h-8 w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {(editForm.quantity * editForm.unitPrice).toFixed(2)}€
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                                <Check className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{line.description}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">{line.unitPrice.toFixed(2)}€</TableCell>
                            <TableCell className="text-right font-medium">{line.total.toFixed(2)}€</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => startEdit(index)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeLine(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={lines.length === 0}>
            <Check className="h-4 w-4 mr-2" />
            Importer {lines.length} ligne{lines.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
