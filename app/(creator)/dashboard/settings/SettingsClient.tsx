'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera, Check, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import type { Profile } from '@/types'

const BIO_MAX = 160

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function SettingsClient({ profile }: { profile: Profile }) {
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    website_url: profile?.website_url || '',
    twitter_handle: profile?.twitter_handle || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
  })

  const initialForm = useRef(form)
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current) || avatarUrl !== (profile?.avatar_url || '')

  function handleChange(field: keyof typeof form, value: string) {
    if (field === 'twitter_handle') {
      value = value.replace(/^@+/, '')
    }
    if (field === 'bio' && value.length > BIO_MAX) return
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'username') setUsernameStatus('idle')
  }

  function handleWebsiteBlur() {
    const val = form.website_url.trim()
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      setForm(prev => ({ ...prev, website_url: `https://${val}` }))
    }
  }

  const checkUsername = useCallback(async () => {
    const username = form.username.trim()
    if (username === profile?.username) { setUsernameStatus('idle'); return }
    if (!username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    setUsernameStatus(data ? 'taken' : 'available')
  }, [form.username, profile?.username])

  async function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setAvatarUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    toast.success('Avatar uploaded')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      toast.error('Please fix username before saving')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        username: form.username.trim(),
        display_name: form.display_name.trim() || null,
        bio: form.bio.trim() || null,
        website_url: form.website_url.trim() || null,
        twitter_handle: form.twitter_handle.trim() || null,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      initialForm.current = form
      toast.success('Profile saved!')
    }
  }

  const usernameIcon = {
    idle: null,
    checking: <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />,
    available: <Check size={14} className="text-green-400" />,
    taken: <X size={14} className="text-red-400" />,
    invalid: <AlertCircle size={14} className="text-yellow-400" />,
  }[usernameStatus]

  const usernameHint = {
    idle: 'Lowercase letters, numbers, underscores. 3–20 chars.',
    checking: 'Checking availability...',
    available: 'Username is available',
    taken: 'That username is already taken',
    invalid: 'Only lowercase letters, numbers, underscores. 3–20 chars.',
  }[usernameStatus]

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center cursor-pointer ring-2 ring-[var(--border)] hover:ring-[#6B21E8] transition-all"
              onClick={handleAvatarClick}
            >
              {avatarUploading ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {(profile?.display_name || profile?.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-6 h-6 bg-[var(--card)] border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--muted-surface)] transition-colors"
            >
              <Camera size={12} className="text-[var(--text-secondary)]" />
            </button>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Click to upload a new photo</p>
            <p className="text-xs text-[var(--text-muted)]">JPG, PNG or WebP · Max 2MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile Info</h2>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
            <input
              type="text"
              value={form.username}
              onChange={e => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onBlur={checkUsername}
              placeholder="yourhandle"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
            />
            {usernameIcon && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">{usernameIcon}</span>
            )}
          </div>
          <p className={`text-xs mt-1 ${usernameStatus === 'available' ? 'text-green-400' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
            {usernameHint}
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Display Name</label>
          <input
            type="text"
            value={form.display_name}
            onChange={e => handleChange('display_name', e.target.value)}
            placeholder="Your name"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
            <span className={`text-xs ${form.bio.length >= BIO_MAX ? 'text-red-400' : form.bio.length >= BIO_MAX * 0.85 ? 'text-yellow-400' : 'text-[var(--text-muted)]'}`}>
              {form.bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            value={form.bio}
            onChange={e => handleChange('bio', e.target.value)}
            rows={3}
            placeholder="Tell the community about yourself..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors resize-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Website</label>
          <input
            type="text"
            value={form.website_url}
            onChange={e => handleChange('website_url', e.target.value)}
            onBlur={handleWebsiteBlur}
            placeholder="https://yoursite.com"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* Twitter */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Twitter / X Handle</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
            <input
              type="text"
              value={form.twitter_handle}
              onChange={e => handleChange('twitter_handle', e.target.value)}
              placeholder="username"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
            />
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">GitHub</label>
          <input
            type="url"
            value={form.github_url}
            onChange={e => handleChange('github_url', e.target.value)}
            placeholder="https://github.com/username"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">LinkedIn</label>
          <input
            type="url"
            value={form.linkedin_url}
            onChange={e => handleChange('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        {isDirty && (
          <p className="text-xs text-yellow-400 flex items-center gap-1.5">
            <AlertCircle size={12} /> Unsaved changes
          </p>
        )}
        <button
          type="submit"
          disabled={saving || !isDirty || usernameStatus === 'taken' || usernameStatus === 'invalid'}
          className="btn-primary text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
