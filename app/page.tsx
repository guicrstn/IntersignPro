import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingContent } from '@/components/landing-content'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingContent />
}
