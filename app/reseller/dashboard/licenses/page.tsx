'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  KeyRound, 
  PlusCircle,
  Search,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Copy,
  Settings,
} from 'lucide-react'
import type { License } from '@/lib/types'

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [resellerId, setResellerId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLicenses = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: resellerData } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!resellerData) return

      setResellerId(resellerData.id)

      const { data } = await supabase
        .from('licenses')
        .select('*')
        .eq('reseller_id', resellerData.id)
        .order('created_at', { ascending: false })

      if (data) {
        setLicenses(data)
        setFilteredLicenses(data)
      }

      setIsLoading(false)
    }

    fetchLicenses()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = licenses.filter(
        l => l.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             l.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
             l.license_key.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLicenses(filtered)
    } else {
      setFilteredLicenses(licenses)
    }
  }, [searchQuery, licenses])

  const toggleLicenseStatus = async (license: License) => {
    const supabase = createClient()
    const newStatus = license.status === 'active' ? 'suspended' : 'active'

    const { error } = await supabase
      .from('licenses')
      .update({ status: newStatus })
      .eq('id', license.id)

    if (!error) {
      setLicenses(prev => prev.map(l => 
        l.id === license.id ? { ...l, status: newStatus } : l
      ))
    }
  }

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key)
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
          <h1 className="text-2xl font-bold text-foreground">Licences</h1>
          <p className="text-muted-foreground">
            Gerez les licences de vos clients
          </p>
        </div>
        <Button asChild>
          <Link href="/reseller/dashboard/licenses/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle licence
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou cle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Licenses list */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les licences</CardTitle>
          <CardDescription>
            {filteredLicenses.length} licence{filteredLicenses.length > 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-8">
              <KeyRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Aucune licence trouvee' : 'Aucune licence pour le moment'}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link href="/reseller/dashboard/licenses/new">
                    Creer une licence
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLicenses.map((license) => (
                <div 
                  key={license.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{license.client_name}</span>
                        <Badge variant={
                          license.status === 'active' ? 'default' : 
                          license.status === 'suspended' ? 'secondary' : 'destructive'
                        }>
                          {license.status === 'active' ? 'Active' : 
                           license.status === 'suspended' ? 'Suspendue' : 'Expiree'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {license.plan}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{license.client_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Cle de licence</p>
                      <p className="text-sm font-mono">{license.license_key.substring(0, 12)}...</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/reseller/dashboard/licenses/${license.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLicenseKey(license.license_key)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier la cle
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/reseller/dashboard/licenses/${license.id}/options`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Gerer les options
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleLicenseStatus(license)}>
                          {license.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Suspendre
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
