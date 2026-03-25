'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2, Mail, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type NotificationPreferences = {
  productUpdates: boolean
  creatorReplies: boolean
  weeklyRoundup: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  productUpdates: true,
  creatorReplies: true,
  weeklyRoundup: false,
}

export function AccountSettingsClient() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [loaded, setLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!isMounted) return

        if (user) {
          setEmail(user.email || '')

          const storedPreferences = user.user_metadata?.notification_preferences
          if (storedPreferences && typeof storedPreferences === 'object') {
            setNotificationPreferences({
              productUpdates: Boolean(storedPreferences.productUpdates),
              creatorReplies: Boolean(storedPreferences.creatorReplies),
              weeklyRoundup: Boolean(storedPreferences.weeklyRoundup),
            })
          }
        }
      } catch (error) {
        console.error('Account settings load failed:', error)
      } finally {
        if (isMounted) setLoaded(true)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [supabase])

  async function handleSaveNotifications() {
    setIsSaving(true)

    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: notificationPreferences,
      },
    })

    setIsSaving(false)

    if (error) {
      console.error('Notification preferences save failed:', error)
      toast.error('Could not save notification preferences')
      return
    }

    toast.success('Account settings saved!')
  }

  async function handlePasswordReset() {
    if (!email) {
      toast.error('No email found for this account')
      return
    }

    setIsSendingReset(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setIsSendingReset(false)

    if (error) {
      console.error('Password reset failed:', error)
      toast.error('Could not send reset email')
      return
    }

    toast.success('Password reset email sent')
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your Rolvibe account permanently? This will remove your profile and submitted apps.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    const response = await fetch('/api/account/delete', { method: 'DELETE' })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setIsDeleting(false)
      toast.error(payload?.error || 'Failed to delete account')
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    toast.success('Account deleted')
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Email</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">This is the email currently attached to your Rolvibe account.</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3">
          <Mail size={16} className="text-[var(--text-muted)]" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Account email</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{email || 'No email found'}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Password</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Send yourself a reset link if you use email sign-in for this account.</p>
        </div>

        <button
          type="button"
          onClick={() => void handlePasswordReset()}
          disabled={isSendingReset}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors disabled:opacity-50"
        >
          {isSendingReset ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send password reset email'
          )}
        </button>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Bell size={18} className="text-[var(--text-muted)] mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Notification Preferences</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Choose which account emails Rolvibe should send you.</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'productUpdates', label: 'Product updates', description: 'Important changes and new features from Rolvibe.' },
            { key: 'creatorReplies', label: 'Creator activity', description: 'Important account and creator-related updates.' },
            { key: 'weeklyRoundup', label: 'Weekly roundup', description: 'A short summary of what is trending on Rolvibe.' },
          ].map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3 cursor-pointer hover:bg-[var(--muted-surface)] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences[key as keyof NotificationPreferences]}
                onChange={event =>
                  setNotificationPreferences(current => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 accent-[#6B21E8]"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveNotifications()}
            disabled={isSaving}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save notification preferences'
            )}
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-red-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-red-400 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-red-300">Danger Zone</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Permanently delete your Rolvibe account, public profile, and submitted apps.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/15 transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting account...
            </>
          ) : (
            'Delete account'
          )}
        </button>
      </div>
    </div>
  )
}
