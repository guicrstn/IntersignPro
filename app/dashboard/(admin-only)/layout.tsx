import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: company } = await supabase
    .from('companies')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  // Redirect non-admin users to dashboard
  if (!company?.is_admin) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
