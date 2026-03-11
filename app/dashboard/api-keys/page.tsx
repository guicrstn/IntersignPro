'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Key, 
  PlusCircle, 
  Copy, 
  Check,
  Trash2,
  AlertTriangle,
  Code,
} from 'lucide-react'
import type { ApiKey } from '@/lib/types'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setApiKeys(data || [])
    }
    setIsLoading(false)
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    setIsCreating(true)

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      const data = await response.json()

      if (data.key) {
        setNewKey(data.key)
        setNewKeyName('')
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    const supabase = createClient()
    
    await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)

    fetchApiKeys()
  }

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setNewKey(null)
    setNewKeyName('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cles API</h1>
          <p className="text-muted-foreground">
            Gerez vos cles d&apos;acces a l&apos;API REST
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle cle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creer une cle API</DialogTitle>
              <DialogDescription>
                Les cles API permettent d&apos;acceder a l&apos;API REST de facon securisee
              </DialogDescription>
            </DialogHeader>

            {newKey ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Copiez cette cle maintenant</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Cette cle ne sera plus visible apres fermeture de cette fenetre.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted p-3 rounded-lg font-mono text-sm break-all">
                    {newKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyKey}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Nom de la cle</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Integration CRM"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {newKey ? (
                <Button onClick={closeDialog}>Fermer</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={closeDialog}>
                    Annuler
                  </Button>
                  <Button onClick={createApiKey} disabled={isCreating || !newKeyName.trim()}>
                    {isCreating ? 'Creation...' : 'Creer la cle'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys list */}
      <Card>
        <CardHeader>
          <CardTitle>Vos cles API</CardTitle>
          <CardDescription>
            {apiKeys.length} cle{apiKeys.length > 1 ? 's' : ''} configuree{apiKeys.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune cle API pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1">
                Creez une cle pour commencer a utiliser l&apos;API
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div 
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {key.key_prefix}...
                        </code>
                        {key.last_used_at && (
                          <span className="text-xs text-muted-foreground">
                            Derniere utilisation: {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette cle ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irreversible. Toutes les applications utilisant cette cle perdront l&apos;acces a l&apos;API.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteApiKey(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentation API
          </CardTitle>
          <CardDescription>
            Comment utiliser l&apos;API REST InterSign Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentification</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Incluez votre cle API dans l&apos;en-tete Authorization :
            </p>
            <code className="block bg-muted p-3 rounded-lg text-sm">
              Authorization: Bearer isp_votre_cle_api
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Endpoints disponibles</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/v1/clients</code>
                <span className="text-muted-foreground">- Liste des clients</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/v1/clients</code>
                <span className="text-muted-foreground">- Creer un client</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/v1/interventions</code>
                <span className="text-muted-foreground">- Liste des interventions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/v1/interventions</code>
                <span className="text-muted-foreground">- Creer une intervention</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/v1/company</code>
                <span className="text-muted-foreground">- Infos entreprise</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Mode Embed (iframe)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Integrez l&apos;application dans votre CRM via iframe :
            </p>
            <code className="block bg-muted p-3 rounded-lg text-sm overflow-x-auto">
              {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed?token=VOTRE_CLE_API" width="100%" height="600"></iframe>`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
