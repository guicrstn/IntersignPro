'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileSignature,
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  PlusCircle,
  CreditCard,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

interface DashboardSidebarProps {
  user: User
  companyName: string
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Interventions', href: '/dashboard/interventions', icon: ClipboardList },
  { name: 'Abonnement', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Cles API', href: '/dashboard/api-keys', icon: Key },
  { name: 'Parametres', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar({ companyName }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <FileSignature className="h-6 w-6 text-sidebar-primary" />
        <span className="font-bold">InterSign Pro</span>
      </div>

      {/* Company Name */}
      <div className="border-b border-sidebar-border px-6 py-4">
        <p className="text-xs text-sidebar-foreground/60">Societe</p>
        <p className="font-medium truncate">{companyName}</p>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <Button asChild className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90">
          <Link href="/dashboard/interventions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle intervention
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          InterSign Pro v1.0
        </p>
      </div>
    </aside>
  )
}
