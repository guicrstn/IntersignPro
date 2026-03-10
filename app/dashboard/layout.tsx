import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get or create company for this user
  let { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) {
    const companyName = user.user_metadata?.company_name || 'Ma Societe'
    const { data: newCompany } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name: companyName,
      })
      .select()
      .single()
    company = newCompany
  }

  return (
    <div className="flex min-h-svh bg-background">
      <DashboardSidebar user={user} companyName={company?.name || 'Ma Societe'} />
      <div className="flex flex-1 flex-col">
        <DashboardHeader 
          user={user} 
          companyName={company?.name || 'Ma Societe'} 
          logoUrl={company?.logo_url ? `/api/logo?pathname=${encodeURIComponent(company.logo_url)}` : null}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
