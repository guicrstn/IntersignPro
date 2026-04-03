'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, User } from 'lucide-react'
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
  status: string
  isNew?: boolean
  assignedIntervenants: { id?: string; intervenantId: string; timeSpent: number }[]
}

export default function EditRepairOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])

  const [orNumber, setOrNumber] = useState('')
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('draft')
  const [tasks, setTasks] = useState<Task[]>([])
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [orRes, clientsRes, intervenantsRes, tasksRes] = await Promise.all([
        supabase
          .from('repair_orders')
          .select('*, clients(id, name)')
          .eq('id', id)
          .single(),
        supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('intervenants').select('id, name, hourly_rate').eq('user_id', user.id).eq('is_active', true).order('name'),
        supabase.from('repair_order_tasks').select('*').eq('repair_order_id', id).order('task_order'),
      ])

      if (orRes.data) {
        setOrNumber(orRes.data.or_number)
        setClientId(orRes.data.client_id || '')
        setTitle(orRes.data.title || '')
        setDescription(orRes.data.description || '')
        setPriority(orRes.data.priority || 'normal')
        setNotes(orRes.data.notes || '')
        setStatus(orRes.data.status || 'draft')
      }

      setClients(clientsRes.data || [])
      setIntervenants(intervenantsRes.data || [])

      if (tasksRes.data && tasksRes.data.length > 0) {
        const taskIds = tasksRes.data.map(t => t.id)
        const { data: assignmentsData } = await supabase
          .from('task_assignments')
          .select('*, intervenants(id, name, hourly_rate)')
          .in('task_id', taskIds)

        const tasksWithAssignments = tasksRes.data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          estimated_hours: task.estimated_hours || 0,
          status: task.status || 'pending',
          assignedIntervenants: (assignmentsData || [])
            .filter(a => a.task_id === task.id)
            .map(a => ({
              id: a.id,
              intervenantId: a.intervenant_id,
              timeSpent: Math.floor(a.time_spent_minutes / 60),
            })),
        }))
        setTasks(tasksWithAssignments)
      } else {
        setTasks([{ 
          id: crypto.randomUUID(), 
          title: '', 
          description: '', 
          estimated_hours: 0, 
          status: 'pending',
          isNew: true, 
          assignedIntervenants: [] 
        }])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const addTask = () => {
    setTasks([...tasks, { 
      id: crypto.randomUUID(), 
      title: '', 
      description: '', 
      estimated_hours: 0,
      status: 'pending',
      isNew: true, 
      assignedIntervenants: [] 
    }])
  }

  const removeTask = (taskId: string) => {
    if (tasks.length === 1) return
    const task = tasks.find(t => t.id === taskId)
    if (task && !task.isNew) {
      setDeletedTaskIds([...deletedTaskIds, taskId])
    }
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

      // Update repair order
      const { error: orError } = await supabase
        .from('repair_orders')
        .update({
          client_id: clientId || null,
          title,
          description,
          priority,
          notes,
        })
        .eq('id', id)

      if (orError) throw orError

      // Delete removed tasks
      for (const taskId of deletedTaskIds) {
        await supabase.from('task_assignments').delete().eq('task_id', taskId)
        await supabase.from('repair_order_tasks').delete().eq('id', taskId)
      }

      // Update or create tasks
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (!task.title.trim()) continue

        if (task.isNew) {
          // Create new task
          const { data: taskData, error: taskError } = await supabase
            .from('repair_order_tasks')
            .insert({
              repair_order_id: id,
              user_id: user.id,
              title: task.title,
              description: task.description,
              estimated_hours: task.estimated_hours,
              status: task.status,
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
        } else {
          // Update existing task
          const { error: taskError } = await supabase
            .from('repair_order_tasks')
            .update({
              title: task.title,
              description: task.description,
              estimated_hours: task.estimated_hours,
              status: task.status,
              task_order: i,
            })
            .eq('id', task.id)

          if (taskError) throw taskError

          // Get existing assignments
          const { data: existingAssignments } = await supabase
            .from('task_assignments')
            .select('id, intervenant_id')
            .eq('task_id', task.id)

          const existingIntervenantIds = existingAssignments?.map(a => a.intervenant_id) || []
          const newIntervenantIds = task.assignedIntervenants.map(a => a.intervenantId)

          // Delete removed assignments
          for (const existing of existingAssignments || []) {
            if (!newIntervenantIds.includes(existing.intervenant_id)) {
              await supabase.from('task_assignments').delete().eq('id', existing.id)
            }
          }

          // Add new assignments
          for (const assignment of task.assignedIntervenants) {
            if (!existingIntervenantIds.includes(assignment.intervenantId)) {
              await supabase.from('task_assignments').insert({
                task_id: task.id,
                intervenant_id: assignment.intervenantId,
                user_id: user.id,
                time_spent_minutes: assignment.timeSpent * 60,
              })
            }
          }
        }
      }

      router.push(`/dashboard/repair-orders/${id}`)
    } catch (error) {
      console.error('Error updating OR:', error)
      alert('Erreur lors de la mise a jour de l\'OR')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="flex items-center justify-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/repair-orders/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifier {orNumber}</h1>
          <p className="text-muted-foreground">Modifiez les informations de l&apos;OR</p>
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
              Modifiez les taches et les intervenants assignes
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
            <Link href={`/dashboard/repair-orders/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}
