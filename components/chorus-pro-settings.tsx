'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

interface ChorusConfig {
  client_id: string
  client_secret: string
  tech_username: string
  tech_password: string
  environment: 'sandbox' | 'production'
  is_enabled: boolean
  siret: string
}

export function ChorusProSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [config, setConfig] = useState<ChorusConfig>({
    client_id: '',
    client_secret: '',
    tech_username: '',
    tech_password: '',
    environment: 'sandbox',
    is_enabled: false,
    siret: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('chorus_pro_config')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setConfig({
          client_id: data.client_id || '',
          client_secret: data.client_secret || '',
          tech_username: data.tech_username || '',
          tech_password: data.tech_password || '',
          environment: data.environment || 'sandbox',
          is_enabled: data.is_enabled || false,
          siret: data.siret || ''
        })
      }
    } catch (error) {
      // No config yet, that's fine
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setTestResult(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecte')

      const { error } = await supabase
        .from('chorus_pro_config')
        .upsert({
          user_id: user.id,
          ...config,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
      toast.success('Configuration Chorus Pro enregistree')
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/chorus-pro/test', {
        method: 'POST'
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur lors du test de connexion' })
    } finally {
      setTesting(false)
    }
  }

  const isConfigComplete = config.client_id && config.client_secret && 
    config.tech_username && config.tech_password && config.siret

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Chorus Pro
              {config.is_enabled && isConfigComplete ? (
                <Badge variant="default" className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Non configure</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configurez votre connexion a Chorus Pro pour la facturation electronique du secteur public
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="chorus-enabled" className="text-sm">Activer</Label>
            <Switch
              id="chorus-enabled"
              checked={config.is_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
              disabled={!isConfigComplete}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Comment obtenir vos identifiants ?</AlertTitle>
          <AlertDescription className="space-y-2">
            <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
              <li>
                Creez un compte sur{' '}
                <a href="https://piste.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  PISTE <ExternalLink className="h-3 w-3 inline" />
                </a>
                {' '}et obtenez vos Client ID / Client Secret
              </li>
              <li>
                Creez un compte technique sur{' '}
                <a href="https://chorus-pro.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Chorus Pro <ExternalLink className="h-3 w-3 inline" />
                </a>
              </li>
              <li>Renseignez le SIRET de votre entreprise</li>
              <li>Testez la connexion en mode Sandbox avant de passer en Production</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Environment Selection */}
        <div className="grid gap-2">
          <Label>Environnement</Label>
          <Select
            value={config.environment}
            onValueChange={(value: 'sandbox' | 'production') => setConfig({ ...config, environment: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Sandbox (Test)
                </div>
              </SelectItem>
              <SelectItem value="production">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Production
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Utilisez Sandbox pour tester avant de passer en production
          </p>
        </div>

        {/* SIRET */}
        <div className="grid gap-2">
          <Label htmlFor="siret">SIRET de votre entreprise *</Label>
          <Input
            id="siret"
            value={config.siret}
            onChange={(e) => setConfig({ ...config, siret: e.target.value.replace(/\s/g, '') })}
            placeholder="12345678901234"
            maxLength={14}
          />
        </div>

        {/* PISTE Credentials */}
        <div className="space-y-4">
          <h4 className="font-medium">Identifiants PISTE</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                value={config.client_id}
                onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                placeholder="Votre Client ID PISTE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_secret">Client Secret *</Label>
              <Input
                id="client_secret"
                type="password"
                value={config.client_secret}
                onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                placeholder="Votre Client Secret PISTE"
              />
            </div>
          </div>
        </div>

        {/* Technical Account */}
        <div className="space-y-4">
          <h4 className="font-medium">Compte technique Chorus Pro</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tech_username">Identifiant technique *</Label>
              <Input
                id="tech_username"
                value={config.tech_username}
                onChange={(e) => setConfig({ ...config, tech_username: e.target.value })}
                placeholder="Nom d'utilisateur technique"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tech_password">Mot de passe technique *</Label>
              <Input
                id="tech_password"
                type="password"
                value={config.tech_password}
                onChange={(e) => setConfig({ ...config, tech_password: e.target.value })}
                placeholder="Mot de passe technique"
              />
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{testResult.success ? 'Connexion reussie' : 'Echec de connexion'}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={saveConfig} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
          <Button 
            variant="outline" 
            onClick={testConnection} 
            disabled={testing || !isConfigComplete}
          >
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tester la connexion
          </Button>
        </div>

        {!isConfigComplete && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Remplissez tous les champs obligatoires (*) pour activer Chorus Pro
          </p>
        )}
      </CardContent>
    </Card>
  )
}
