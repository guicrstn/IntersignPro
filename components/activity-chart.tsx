'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Intervention } from '@/lib/types'

interface ActivityChartProps {
  interventions: Intervention[]
}

export function ActivityChart({ interventions }: ActivityChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const { weeklyData, monthLabel, totalMonth } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Obtenir le premier et dernier jour du mois
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Filtrer les interventions du mois
    const monthInterventions = interventions.filter(i => {
      const date = new Date(i.date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    
    // Grouper par semaine
    const weeks: { name: string; interventions: number; signees: number }[] = []
    let weekStart = new Date(firstDay)
    let weekNum = 1
    
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())
      
      const weekInterventions = monthInterventions.filter(i => {
        const date = new Date(i.date)
        return date >= weekStart && date <= weekEnd
      })
      
      weeks.push({
        name: `Sem ${weekNum}`,
        interventions: weekInterventions.length,
        signees: weekInterventions.filter(i => i.status === 'signed').length,
      })
      
      weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() + 1)
      weekNum++
    }
    
    const monthNames = [
      'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
    ]
    
    return {
      weeklyData: weeks,
      monthLabel: `${monthNames[month]} ${year}`,
      totalMonth: monthInterventions.length,
    }
  }, [interventions, currentDate])
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    if (next <= new Date()) {
      setCurrentDate(next)
    }
  }
  
  const isCurrentMonth = () => {
    const now = new Date()
    return currentDate.getMonth() === now.getMonth() && 
           currentDate.getFullYear() === now.getFullYear()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Activite</CardTitle>
          <CardDescription>{totalMonth} intervention{totalMonth > 1 ? 's' : ''} ce mois</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthLabel}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
            disabled={isCurrentMonth()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorInterventions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSignees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">
                              Total: {payload[0]?.value}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent" />
                            <span className="text-sm text-muted-foreground">
                              Signees: {payload[1]?.value}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="interventions"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorInterventions)"
              />
              <Area
                type="monotone"
                dataKey="signees"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#colorSignees)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Interventions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Signees</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
