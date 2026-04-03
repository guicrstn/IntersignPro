'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, Clock, User, Play, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface RepairOrder {
  id: string
  or_number: string
  title: string
  description: string
  status: string
  priority: string
  notes: string
  created_at: string
  clients: { id: string; name: string } | null
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  estimated_hours: number
  task_order: number
}

interface Assignment {
  id: string
  task_id: string
  intervenant_id: string
  time_spent_minutes: number
  intervenants: { id: string; name: string; hourly_rate: number | null }
}

interface Intervenant {
  id: string
  name: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
  converted: 'Converti',
}

const taskStatusLabels: Record<string, string> = {
  pending: 'A faire',
  in_progress: 'En cours',
  completed: 'Termine',
}

export default function RepairOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [repairOrder, setRepairOrder] = useState<RepairOrder | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [hidePrice, setHidePrice] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [orRes, tasksRes, intervenantsRes] = await Promise.all([
        supabase
          .from('repair_orders')
          .select('*, clients(id, name)')
          .eq('id', id)
          .single(),
        supabase
          .from('repair_order_tasks')
          .select('*')
          .eq('repair_order_id', id)
          .order('task_order'),
        supabase
          .from('intervenants')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ])

      if (orRes.data) setRepairOrder(orRes.data)
      if (tasksRes.data) {
        setTasks(tasksRes.data)
        
        // Load assignments for all tasks
        const taskIds = tasksRes.data.map(t => t.id)
        if (taskIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('task_assignments')
            .select('*, intervenants(id, name, hourly_rate)')
            .in('task_id', taskIds)
          
          setAssignments(assignmentsData || [])
        }
      }
      if (intervenantsRes.data) setIntervenants(intervenantsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    const updates: any = { status: newStatus }
    if (newStatus === 'in_progress' && !repairOrder?.started_at) {
      updates.started_at = new Date().toISOString()
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    await supabase
      .from('repair_orders')
      .update(updates)
      .eq('id', id)

    loadData()
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase
      .from('repair_order_tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    loadData()
  }

  const updateTimeSpent = async (assignmentId: string, minutes: number) => {
    await supabase
      .from('task_assignments')
      .update({ time_spent_minutes: minutes })
      .eq('id', assignmentId)

    loadData()
  }

  const convertToDeliveryNote = async () => {
    setConverting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !repairOrder) return

      // Get user's default company
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      const companyId = userCompany?.company_id || null

      // Generate BL number
      const year = new Date().getFullYear()
      const { data: sequence } = await supabase
        .from('document_sequences')
        .select('current_number')
        .eq('user_id', user.id)
        .eq('document_type', 'livraison')
        .eq('year', year)
        .single()

      let nextNumber = 1
      if (sequence) {
        nextNumber = sequence.current_number + 1
        await supabase
          .from('document_sequences')
          .update({ current_number: nextNumber })
          .eq('user_id', user.id)
          .eq('document_type', 'livraison')
          .eq('year', year)
      } else {
        await supabase.from('document_sequences').insert({
          user_id: user.id,
          document_type: 'livraison',
          prefix: 'BL',
          current_number: 1,
          year,
        })
      }

      const blNumber = `BL-${year}-${String(nextNumber).padStart(4, '0')}`

      // Create document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          company_id: companyId,
          client_id: repairOrder.clients?.id || null,
          document_type: 'livraison',
          document_number: blNumber,
          document_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          subject: `Bon de livraison - ${repairOrder.or_number}`,
          notes: repairOrder.notes,
          hide_prices: hidePrice,
        })
        .select()
        .single()

      if (docError) throw docError

      // Create lines from tasks
      let lineOrder = 0
      for (const task of tasks) {
        const taskAssignments = assignments.filter(a => a.task_id === task.id)
        const totalMinutes = taskAssignments.reduce((sum, a) => sum + a.time_spent_minutes, 0)
        const totalHours = totalMinutes / 60

        // Calculate average hourly rate
        let totalCost = 0
        for (const assignment of taskAssignments) {
          const rate = assignment.intervenants?.hourly_rate || 0
          totalCost += (assignment.time_spent_minutes / 60) * rate
        }

        await supabase.from('document_lines').insert({
          document_id: document.id,
          line_order: lineOrder,
          line_type: 'service',
          description: task.title + (task.description ? ` - ${task.description}` : ''),
          quantity: totalHours || task.estimated_hours || 1,
          unit: 'heure',
          unit_price_ht: taskAssignments.length > 0 && totalHours > 0 ? totalCost / totalHours : 0,
          tva_rate: 20,
          discount_percent: 0,
          discount_amount: 0,
        })
        lineOrder++
      }

      // Update repair order
      await supabase
        .from('repair_orders')
        .update({
          status: 'converted',
          converted_document_id: document.id,
        })
        .eq('id', id)

      setConvertDialogOpen(false)
      router.push(`/dashboard/documents/${document.id}`)
    } catch (error) {
      console.error('Error converting to delivery note:', error)
      alert('Erreur lors de la conversion')
    } finally {
      setConverting(false)
    }
  }

  const getTotalTime = () => {
    const totalMinutes = assignments.reduce((sum, a) => sum + a.time_spent_minutes, 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Chargement...</div>
  }

  if (!repairOrder) {
    return <div className="flex items-center justify-center py-12">OR non trouve</div>
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{repairOrder.or_number}</h1>
              <Badge className={statusColors[repairOrder.status]}>
                {statusLabels[repairOrder.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {repairOrder.clients?.name || 'Sans client'}
              {repairOrder.title && ` - ${repairOrder.title}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {repairOrder.status === 'draft' && (
            <Button onClick={() => updateStatus('in_progress')}>
              <Play className="mr-2 h-4 w-4" />
              Demarrer
            </Button>
          )}
          {repairOrder.status === 'in_progress' && (
            <Button onClick={() => updateStatus('completed')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Terminer
            </Button>
          )}
          {(repairOrder.status === 'completed' || repairOrder.status === 'in_progress') && (
            <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Convertir en BL
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convertir en Bon de Livraison</DialogTitle>
                  <DialogDescription>
                    Cette action va creer un bon de livraison a partir de cet OR avec toutes les taches et le temps passe.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-price"
                      checked={hidePrice}
                      onCheckedChange={(checked) => setHidePrice(checked as boolean)}
                    />
                    <Label htmlFor="hide-price">Masquer les prix sur le bon de livraison</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={convertToDeliveryNote} disabled={converting}>
                    {converting ? 'Conversion...' : 'Convertir'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps total</p>
                <p className="text-xl font-bold">{getTotalTime()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taches terminees</p>
                <p className="text-xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intervenants</p>
                <p className="text-xl font-bold">
                  {new Set(assignments.map(a => a.intervenant_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taches</CardTitle>
          <CardDescription>Suivez l&apos;avancement et le temps passe par intervenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => {
            const taskAssignments = assignments.filter(a => a.task_id === task.id)
            return (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">A faire</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Termine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {taskAssignments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Temps par intervenant</Label>
                    {taskAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{assignment.intervenants?.name}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-20 h-8"
                            value={Math.floor(assignment.time_spent_minutes / 60)}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value) || 0
                              const currentMinutes = assignment.time_spent_minutes % 60
                              updateTimeSpent(assignment.id, hours * 60 + currentMinutes)
                            }}
                          />
                          <span className="text-sm">h</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            className="w-16 h-8"
                            value={assignment.time_spent_minutes % 60}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value) || 0
                              const currentHours = Math.floor(assignment.time_spent_minutes / 60)
                              updateTimeSpent(assignment.id, currentHours * 60 + Math.min(59, minutes))
                            }}
                          />
                          <span className="text-sm">min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {taskAssignments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Aucun intervenant assigne</p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {repairOrder.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{repairOrder.description}</p>
          </CardContent>
        </Card>
      )}

      {repairOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{repairOrder.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
