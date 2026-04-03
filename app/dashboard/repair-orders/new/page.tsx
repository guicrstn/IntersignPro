'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, User, Clock } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
}

interface Intervenant {
  id: string
  name: string
  hourly_rate: number | null
}

interface Task {
  id: string
  title: string
  description: string
  estimated_hours: number
  assignedIntervenants: { intervenantId: string; timeSpent: number }[]
}

export default function NewRepairOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [tasks, setTasks] = useState<Task[]>([
    { id: crypto.randomUUID(), title: '', description: '', estimated_hours: 0, assignedIntervenants: [] }
  ])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientsRes, intervenantsRes] = await Promise.all([
      supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('intervenants').select('id, name, hourly_rate').eq('user_id', user.id).eq('is_active', true).order('name'),
    ])

    setClients(clientsRes.data || [])
    setIntervenants(intervenantsRes.data || [])
  }

  const addTask = () => {
    setTasks([...tasks, { 
      id: crypto.randomUUID(), 
      title: '', 
      description: '', 
      estimated_hours: 0, 
      assignedIntervenants: [] 
    }])
  }

  const removeTask = (taskId: string) => {
    if (tasks.length === 1) return
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const updateTask = (taskId: string, field: keyof Task, value: any) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t))
  }

  const addIntervenantToTask = (taskId: string, intervenantId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t
      if (t.assignedIntervenants.find(a => a.intervenantId === intervenantId)) return t
      return {
        ...t,
        assignedIntervenants: [...t.assignedIntervenants, { intervenantId, timeSpent: 0 }]
      }
    }))
  }

  const removeIntervenantFromTask = (taskId: string, intervenantId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        assignedIntervenants: t.assignedIntervenants.filter(a => a.intervenantId !== intervenantId)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecte')

      // Generate OR number
      const year = new Date().getFullYear()
      const { data: sequence } = await supabase
        .from('document_sequences')
        .select('current_number')
        .eq('user_id', user.id)
        .eq('document_type', 'or')
        .eq('year', year)
        .single()

      let nextNumber = 1
      if (sequence) {
        nextNumber = sequence.current_number + 1
        await supabase
          .from('document_sequences')
          .update({ current_number: nextNumber })
          .eq('user_id', user.id)
          .eq('document_type', 'or')
          .eq('year', year)
      } else {
        await supabase.from('document_sequences').insert({
          user_id: user.id,
          document_type: 'or',
          prefix: 'OR',
          current_number: 1,
          year,
        })
      }

      const orNumber = `OR-${year}-${String(nextNumber).padStart(4, '0')}`

      // Create repair order
      const { data: repairOrder, error: orError } = await supabase
        .from('repair_orders')
        .insert({
          user_id: user.id,
          client_id: clientId || null,
          or_number: orNumber,
          title,
          description,
          priority,
          notes,
          status: 'draft',
        })
        .select()
        .single()

      if (orError) throw orError

      // Create tasks
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (!task.title.trim()) continue

        const { data: taskData, error: taskError } = await supabase
          .from('repair_order_tasks')
          .insert({
            repair_order_id: repairOrder.id,
            user_id: user.id,
            title: task.title,
            description: task.description,
            estimated_hours: task.estimated_hours,
            task_order: i,
          })
          .select()
          .single()

        if (taskError) throw taskError

        // Create task assignments
        for (const assignment of task.assignedIntervenants) {
          await supabase.from('task_assignments').insert({
            task_id: taskData.id,
            intervenant_id: assignment.intervenantId,
            user_id: user.id,
            time_spent_minutes: assignment.timeSpent * 60,
          })
        }
      }

      router.push(`/dashboard/repair-orders/${repairOrder.id}`)
    } catch (error) {
      console.error('Error creating OR:', error)
      alert('Erreur lors de la creation de l\'OR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/repair-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvel Ordre de Reparation</h1>
          <p className="text-muted-foreground">Creez un OR avec des taches et des intervenants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priorite</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Titre de l&apos;OR</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reparation moule injection"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description detaillee de l'ordre de reparation..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Taches</span>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une tache
              </Button>
            </CardTitle>
            <CardDescription>
              Definissez les taches a realiser et assignez des intervenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {tasks.map((task, index) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tache {index + 1}</h4>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Titre de la tache *</Label>
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                      placeholder="Ex: Demontage du moule"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Temps estime (heures)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={task.estimated_hours}
                      onChange={(e) => updateTask(task.id, 'estimated_hours', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={task.description}
                    onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                    placeholder="Details de la tache..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Intervenants assignes
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedIntervenants.map(assignment => {
                      const intervenant = intervenants.find(i => i.id === assignment.intervenantId)
                      return intervenant ? (
                        <div key={assignment.intervenantId} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1">
                          <span className="text-sm">{intervenant.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => removeIntervenantFromTask(task.id, assignment.intervenantId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null
                    })}
                    <Select onValueChange={(value) => addIntervenantToTask(task.id, value)}>
                      <SelectTrigger className="w-auto">
                        <Plus className="h-4 w-4 mr-1" />
                        <span>Ajouter</span>
                      </SelectTrigger>
                      <SelectContent>
                        {intervenants
                          .filter(i => !task.assignedIntervenants.find(a => a.intervenantId === i.id))
                          .map(intervenant => (
                            <SelectItem key={intervenant.id} value={intervenant.id}>
                              {intervenant.name}
                            </SelectItem>
                          ))}
                        {intervenants.filter(i => !task.assignedIntervenants.find(a => a.intervenantId === i.id)).length === 0 && (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            Aucun intervenant disponible
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {intervenants.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Link href="/dashboard/repair-orders/intervenants" className="text-primary hover:underline">
                        Ajoutez des intervenants
                      </Link> pour pouvoir les assigner aux taches.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes supplementaires..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/repair-orders">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creation...' : 'Creer l\'OR'}
          </Button>
        </div>
      </form>
    </div>
  )
}
