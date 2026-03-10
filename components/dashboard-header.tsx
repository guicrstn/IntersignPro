'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  FileSignature,
  LogOut,
  Menu,
  Settings,
  User as UserIcon,
  LayoutDashboard,
  Users,
  ClipboardList,
  PlusCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  user: User
  companyName: string
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Interventions', href: '/dashboard/interventions', icon: ClipboardList },
  { name: 'Parametres', href: '/dashboard/settings', icon: Settings },
]

export function DashboardHeader({ user, companyName }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <FileSignature className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold">InterSign Pro</span>
          </div>
          <div className="border-b border-sidebar-border px-6 py-4">
            <p className="text-xs text-sidebar-foreground/60">Societe</p>
            <p className="font-medium truncate">{companyName}</p>
          </div>
          <div className="p-4">
            <Button asChild className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90">
              <Link href="/dashboard/interventions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle intervention
              </Link>
            </Button>
          </div>
          <nav className="px-4">
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
        </SheetContent>
      </Sheet>

      {/* Mobile Logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <FileSignature className="h-5 w-5 text-primary" />
        <span className="font-bold">InterSign Pro</span>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="hidden md:inline-block max-w-32 truncate">
              {user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Parametres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Deconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
