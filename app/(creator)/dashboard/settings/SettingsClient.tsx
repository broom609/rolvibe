'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera, Check, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'

const BIO_MAX = 160
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function SettingsClient() {
  const supabase = createClient()

  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [originalUsername, setOriginalUsername] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile load error:', error)
        toast.error('Failed to load profile')
        return
      }

      if (data) {
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
        setOriginalUsername(data.username || '')
        setBio(data.bio || '')
        setWebsiteUrl(data.website_url || '')
        setTwitterHandle(data.twitter_handle || '')
        setGithubUrl(data.github_url || '')
        setLinkedinUrl(data.linkedin_url || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoaded(true)
      setIsDirty(false)
    }
    loadProfile()
  }, [])

  const checkUsername = useCallback(async () => {
    if (username === originalUsername) { setUsernameStatus('idle'); return }
    if (!username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    setUsernameStatus(data ? 'taken' : 'available')
  }, [username, originalUsername, supabase])

  function handleWebsiteBlur() {
    const val = websiteUrl.trim()
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      setWebsiteUrl(`https://${val}`)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${ext}`

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
    setIsDirty(true)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not logged in')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        twitter_handle: twitterHandle.replace('@', '').trim() || null,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      console.error('Profile save error:', error)
      toast.error('Failed to save: ' + error.message)
    } else {
      setOriginalUsername(username)
      setUsernameStatus('idle')
      setIsDirty(false)
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
    checking: 'Checking...',
    available: 'Username is available',
    taken: 'That username is already taken',
    invalid: 'Only lowercase letters, numbers, underscores. 3–20 chars.',
  }[usernameStatus]

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center cursor-pointer ring-2 ring-[var(--border)] hover:ring-[#6B21E8] transition-all relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {(displayName || username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
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
              value={username}
              onChange={e => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                setUsernameStatus('idle')
                setIsDirty(true)
              }}
              onBlur={checkUsername}
              placeholder="yourhandle"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
            />
            {usernameIcon && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">{usernameIcon}</span>
            )}
          </div>
          <p className={`text-xs mt-1 ${
            usernameStatus === 'available' ? 'text-green-400' :
            usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-400' :
            'text-[var(--text-muted)]'
          }`}>{usernameHint}</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); setIsDirty(true) }}
            placeholder="Your name"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
            <span className={`text-xs ${bio.length >= BIO_MAX ? 'text-red-400' : bio.length >= BIO_MAX * 0.85 ? 'text-yellow-400' : 'text-[var(--text-muted)]'}`}>
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={e => {
              if (e.target.value.length <= BIO_MAX) {
                setBio(e.target.value)
                setIsDirty(true)
              }
            }}
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
            value={websiteUrl}
            onChange={e => { setWebsiteUrl(e.target.value); setIsDirty(true) }}
            onBlur={handleWebsiteBlur}
            placeholder="https://yoursite.com"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* Twitter */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Twitter / X</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
            <input
              type="text"
              value={twitterHandle}
              onChange={e => { setTwitterHandle(e.target.value.replace(/^@+/, '')); setIsDirty(true) }}
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
            value={githubUrl}
            onChange={e => { setGithubUrl(e.target.value); setIsDirty(true) }}
            placeholder="https://github.com/username"
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">LinkedIn</label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={e => { setLinkedinUrl(e.target.value); setIsDirty(true) }}
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
          className="btn-primary text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving...</>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}
