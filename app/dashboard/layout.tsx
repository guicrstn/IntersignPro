import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'

// Fonction pour verifier si l'abonnement est valide
function hasValidSubscription(company: {
  subscription_status?: string | null
  subscription_end_date?: string | null
  subscription_plan?: string | null
} | null): boolean {
  if (!company) return false
  
  const status = company.subscription_status
  
  // Statuts valides: active, trialing
  if (status === 'active' || status === 'trialing') {
    return true
  }
  
  // Verifier si l'abonnement annule est encore valide jusqu'a la date de fin
  if (status === 'canceled' && company.subscription_end_date) {
    const endDate = new Date(company.subscription_end_date)
    if (endDate > new Date()) {
      return true
    }
  }
  
  // Plan lifetime = acces permanent
  if (company.subscription_plan === 'lifetime') {
    return true
  }
  
  return false
}

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

  // Verifier si l'utilisateur a un abonnement valide
  if (!hasValidSubscription(company)) {
    redirect('/pricing?requires_subscription=true')
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
