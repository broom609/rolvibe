import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountSettingsClient } from './AccountSettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/settings')

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Settings</h1>
      <p className="text-sm text-[var(--text-secondary)] -mt-3">
        Manage your account email, notification preferences, password reset, and account deletion.
      </p>
      <AccountSettingsClient />
    </div>
  )
}
