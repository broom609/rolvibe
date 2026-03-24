'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Profile } from '@/types'

export function SettingsClient({ profile }: { profile: Profile }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    website_url: profile?.website_url || '',
    twitter_handle: profile?.twitter_handle || '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  }

  return (
    <form onSubmit={handleSave} className="bg-[#1A1A1E] border border-[#2A2A30] rounded-2xl p-6 space-y-4">
      {[
        { name: 'display_name', label: 'Display Name', placeholder: 'Your name' },
        { name: 'website_url', label: 'Website', placeholder: 'https://yoursite.com' },
        { name: 'twitter_handle', label: 'Twitter/X Handle', placeholder: 'username (no @)' },
      ].map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">{label}</label>
          <input
            type={name === 'website_url' ? 'url' : 'text'}
            value={form[name as keyof typeof form]}
            onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
            placeholder={placeholder}
            className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#6B21E8]"
          />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          placeholder="Tell the community about yourself..."
          className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#6B21E8] resize-none"
        />
      </div>
      <div className="pt-2 border-t border-[#2A2A30]">
        <p className="text-xs text-[#71717A] mb-1">Username</p>
        <p className="text-sm text-[#A1A1AA] font-mono">@{profile?.username}</p>
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-sm">
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
      </button>
    </form>
  )
}
