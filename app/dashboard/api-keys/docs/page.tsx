'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Code, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/clients',
      description: 'Liste tous les clients',
      response: `{
  "data": [
    {
      "id": "uuid",
      "name": "Client SA",
      "email": "contact@client.fr",
      "phone": "0123456789",
      "address": "1 rue Example",
      "city": "Paris",
      "postal_code": "75001"
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/v1/clients',
      description: 'Creer un nouveau client',
      body: `{
  "name": "Nouveau Client",
  "email": "nouveau@client.fr",
  "phone": "0123456789",
  "address": "1 rue Example",
  "city": "Paris",
  "postal_code": "75001"
}`,
      response: `{
  "data": { "id": "uuid", ... }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/interventions',
      description: 'Liste toutes les interventions',
      response: `{
  "data": [
    {
      "id": "uuid",
      "intervention_number": "INT-2026-0001",
      "description": "Description...",
      "date": "2026-03-11",
      "status": "signed",
      "client": { "name": "Client SA" }
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/v1/interventions',
      description: 'Creer une intervention',
      body: `{
  "client_id": "uuid",
  "description": "Description de l'intervention"
}`,
      response: `{
  "data": { "id": "uuid", "intervention_number": "INT-2026-0001", ... }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/company',
      description: 'Informations de la societe',
      response: `{
  "data": {
    "name": "Ma Societe",
    "address": "1 rue Example",
    "city": "Paris"
  }
}`,
    },
  ]

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
    }
    return <Badge className={colors[method] || 'bg-gray-100'}>{method}</Badge>
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative bg-muted rounded-md">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre className="p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/api-keys">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentation API</h1>
          <p className="text-muted-foreground">
            Reference complete de l&apos;API REST InterSign Pro
          </p>
        </div>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Authentification</CardTitle>
          <CardDescription>
            Toutes les requetes doivent inclure votre cle API dans le header
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            id="auth"
            code={`curl -X GET "https://votre-domaine.com/api/v1/clients" \\
  -H "X-API-Key: votre_cle_api"`}
          />
        </CardContent>
      </Card>

      {/* Embed Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Mode Iframe (Embed)</CardTitle>
          <CardDescription>
            Integrez InterSign Pro directement dans votre CRM ou application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez integrer l&apos;interface InterSign Pro dans une iframe en utilisant votre cle API.
          </p>
          <CodeBlock
            id="iframe"
            code={`<iframe 
  src="https://votre-domaine.com/embed?api_key=VOTRE_CLE_API"
  width="100%"
  height="600"
  frameborder="0"
></iframe>`}
          />
          <div className="text-sm">
            <strong>Pages disponibles en mode embed :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li><code>/embed?api_key=XXX</code> - Dashboard</li>
              <li><code>/embed/interventions?api_key=XXX</code> - Liste des interventions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <CardTitle>Endpoints</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                {getMethodBadge(endpoint.method)}
                <code className="text-sm font-mono">{endpoint.path}</code>
              </div>
              <p className="text-sm text-muted-foreground">{endpoint.description}</p>
              
              {endpoint.body && (
                <div>
                  <p className="text-xs font-medium mb-2">Body</p>
                  <CodeBlock code={endpoint.body} id={`body-${index}`} />
                </div>
              )}
              
              <div>
                <p className="text-xs font-medium mb-2">Response</p>
                <CodeBlock code={endpoint.response} id={`response-${index}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Codes d&apos;erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b">
              <code className="text-sm">401 Unauthorized</code>
              <span className="text-sm text-muted-foreground">Cle API manquante ou invalide</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <code className="text-sm">404 Not Found</code>
              <span className="text-sm text-muted-foreground">Ressource non trouvee</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <code className="text-sm">400 Bad Request</code>
              <span className="text-sm text-muted-foreground">Donnees invalides</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <code className="text-sm">500 Internal Error</code>
              <span className="text-sm text-muted-foreground">Erreur serveur</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
