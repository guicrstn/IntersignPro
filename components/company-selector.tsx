'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, ChevronDown, Plus, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Company {
  id: string
  name: string
  siret: string | null
  is_default?: boolean
}

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanySiret, setNewCompanySiret] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's companies through user_companies table
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id, is_default, companies(id, name, siret)')
        .eq('user_id', user.id)

      if (userCompanies && userCompanies.length > 0) {
        const companyList = userCompanies.map((uc: any) => ({
          id: uc.companies.id,
          name: uc.companies.name,
          siret: uc.companies.siret,
          is_default: uc.is_default,
        }))
        setCompanies(companyList)

        // Set current company from localStorage or default
        const savedCompanyId = localStorage.getItem('currentCompanyId')
        const defaultCompany = companyList.find((c: Company) => c.is_default) || companyList[0]
        const current = savedCompanyId 
          ? companyList.find((c: Company) => c.id === savedCompanyId) || defaultCompany
          : defaultCompany
        setCurrentCompany(current)
        localStorage.setItem('currentCompanyId', current.id)
      } else {
        // Check if user has a company but no user_companies entry
        const { data: company } = await supabase
          .from('companies')
          .select('id, name, siret')
          .eq('user_id', user.id)
          .single()

        if (company) {
          // Create user_companies entry
          await supabase.from('user_companies').insert({
            user_id: user.id,
            company_id: company.id,
            role: 'owner',
            is_default: true,
          })
          setCompanies([{ ...company, is_default: true }])
          setCurrentCompany({ ...company, is_default: true })
          localStorage.setItem('currentCompanyId', company.id)
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectCompany = (company: Company) => {
    setCurrentCompany(company)
    localStorage.setItem('currentCompanyId', company.id)
    router.refresh()
  }

  const createCompany = async () => {
    if (!newCompanyName.trim()) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create new company
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: newCompanyName.trim(),
          siret: newCompanySiret.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      // Create user_companies entry
      await supabase.from('user_companies').insert({
        user_id: user.id,
        company_id: company.id,
        role: 'owner',
        is_default: companies.length === 0,
      })

      const newCompany = { ...company, is_default: companies.length === 0 }
      setCompanies([...companies, newCompany])
      setCurrentCompany(newCompany)
      localStorage.setItem('currentCompanyId', company.id)
      setNewCompanyName('')
      setNewCompanySiret('')
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating company:', error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">Chargement...</span>
      </Button>
    )
  }

  if (companies.length === 0) {
    return null
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate hidden sm:inline">{currentCompany?.name || 'Societe'}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mes societes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => selectCompany(company)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{company.name}</span>
                {company.siret && (
                  <span className="text-xs text-muted-foreground">{company.siret}</span>
                )}
              </div>
              {currentCompany?.id === company.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une societe
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une societe</DialogTitle>
          <DialogDescription>
            Creez une nouvelle societe pour gerer vos documents separement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Nom de la societe *</Label>
            <Input
              id="company-name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Ex: GC Informatik"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-siret">SIRET (optionnel)</Label>
            <Input
              id="company-siret"
              value={newCompanySiret}
              onChange={(e) => setNewCompanySiret(e.target.value)}
              placeholder="Ex: 12345678901234"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={createCompany} disabled={!newCompanyName.trim() || creating}>
            {creating ? 'Creation...' : 'Creer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
