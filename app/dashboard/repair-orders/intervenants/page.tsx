'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Pencil, Trash2, User } from 'lucide-react'
import Link from 'next/link'

interface Intervenant {
  id: string
  name: string
  email: string | null
  phone: string | null
  hourly_rate: number | null
  speciality: string | null
  is_active: boolean
}

export default function IntervenantsPage() {
  const supabase = createClient()
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIntervenant, setEditingIntervenant] = useState<Intervenant | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [speciality, setSpeciality] = useState('')

  useEffect(() => {
    loadIntervenants()
  }, [])

  const loadIntervenants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('intervenants')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      setIntervenants(data || [])
    } catch (error) {
      console.error('Error loading intervenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setHourlyRate('')
    setSpeciality('')
    setEditingIntervenant(null)
  }

  const openEditDialog = (intervenant: Intervenant) => {
    setEditingIntervenant(intervenant)
    setName(intervenant.name)
    setEmail(intervenant.email || '')
    setPhone(intervenant.phone || '')
    setHourlyRate(intervenant.hourly_rate?.toString() || '')
    setSpeciality(intervenant.speciality || '')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const intervenantData = {
        user_id: user.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        speciality: speciality.trim() || null,
      }

      if (editingIntervenant) {
        await supabase
          .from('intervenants')
          .update(intervenantData)
          .eq('id', editingIntervenant.id)
      } else {
        await supabase.from('intervenants').insert(intervenantData)
      }

      setDialogOpen(false)
      resetForm()
      loadIntervenants()
    } catch (error) {
      console.error('Error saving intervenant:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (intervenant: Intervenant) => {
    await supabase
      .from('intervenants')
      .update({ is_active: !intervenant.is_active })
      .eq('id', intervenant.id)

    loadIntervenants()
  }

  const deleteIntervenant = async (id: string) => {
    if (!confirm('Supprimer cet intervenant ?')) return

    await supabase.from('intervenants').delete().eq('id', id)
    loadIntervenants()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/repair-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Intervenants</h1>
            <p className="text-muted-foreground">
              Gerez vos techniciens et intervenants pour les OR
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un intervenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIntervenant ? 'Modifier l\'intervenant' : 'Nouvel intervenant'}
              </DialogTitle>
              <DialogDescription>
                {editingIntervenant
                  ? 'Modifiez les informations de l\'intervenant'
                  : 'Ajoutez un technicien ou intervenant pour vos OR'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telephone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Taux horaire (EUR)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="45.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="speciality">Specialite</Label>
                <Input
                  id="speciality"
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  placeholder="Ex: Mouliste, Electromecanicien..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!name.trim() || saving}>
                {saving ? 'Enregistrement...' : (editingIntervenant ? 'Modifier' : 'Ajouter')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {intervenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun intervenant</h3>
            <p className="text-muted-foreground text-center mb-4">
              Ajoutez vos techniciens pour pouvoir les assigner aux taches des OR.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un intervenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialite</TableHead>
                  <TableHead>Taux horaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intervenants.map((intervenant) => (
                  <TableRow key={intervenant.id}>
                    <TableCell className="font-medium">{intervenant.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {intervenant.email && <div>{intervenant.email}</div>}
                        {intervenant.phone && <div className="text-muted-foreground">{intervenant.phone}</div>}
                        {!intervenant.email && !intervenant.phone && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>{intervenant.speciality || '-'}</TableCell>
                    <TableCell>
                      {intervenant.hourly_rate
                        ? `${intervenant.hourly_rate.toFixed(2)} EUR/h`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={intervenant.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(intervenant)}
                      >
                        {intervenant.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(intervenant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteIntervenant(intervenant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
