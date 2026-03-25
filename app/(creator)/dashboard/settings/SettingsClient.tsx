'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { AlertCircle, Camera, Check, ExternalLink, Github, Globe, Linkedin, Loader2, Twitter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const BIO_MAX = 160
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

export function SettingsClient() {
  const [supabase] = useState(() => createClient())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loaded, setLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [originalUsername, setOriginalUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) {
          return
        }

        setUserId(user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Profile load error:', error)
          toast.error('Failed to load profile')
        }

        if (data && isMounted) {
          setDisplayName(data.display_name || '')
          setUsername(data.username || '')
          setOriginalUsername(data.username || '')
          setBio(data.bio || '')
          setWebsiteUrl(data.website_url || '')
          setTwitterHandle(data.twitter_handle || '')
          setGithubUrl(data.github_url || '')
          setLinkedinUrl(data.linkedin_url || '')
          setAvatarUrl(data.avatar_url || '')
          setIsDirty(false)
        }
      } catch (error) {
        console.error('Profile page load failed:', error)
        toast.error('Failed to load your profile')
      } finally {
        if (isMounted) setLoaded(true)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [supabase])

  async function validateUsername(nextUsername: string) {
    if (nextUsername === originalUsername) {
      setUsernameStatus('idle')
      return true
    }

    if (!nextUsername) {
      setUsernameStatus('idle')
      return true
    }

    if (!/^[a-z0-9_]{3,20}$/.test(nextUsername)) {
      setUsernameStatus('invalid')
      return false
    }

    setUsernameStatus('checking')

    const query = supabase
      .from('profiles')
      .select('id')
      .eq('username', nextUsername)

    const { data, error } = await (userId ? query.neq('id', userId).maybeSingle() : query.maybeSingle())

    if (error) {
      console.error('Username check error:', error)
      setUsernameStatus('idle')
      return true
    }

    const available = !data
    setUsernameStatus(available ? 'available' : 'taken')
    return available
  }

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('Image must be under 5MB')
      return
    }

    setAvatarUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not logged in')
        return
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const filePath = `avatars/${user.id}/avatar.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Avatar update error:', updateError)
        toast.error('Failed to update avatar: ' + updateError.message)
        return
      }

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
      setIsDirty(false)
      toast.success('Photo updated!')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      toast.error('Please fix your username before saving')
      return
    }

    const normalizedUsername = username.trim().toLowerCase()
    const isUsernameValid = await validateUsername(normalizedUsername)
    if (!isUsernameValid) {
      toast.error('Please choose a different username')
      return
    }

    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not logged in')
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: normalizedUsername,
        bio: bio.trim(),
        website_url: normalizeUrl(websiteUrl) || null,
        twitter_handle: twitterHandle.replace('@', '').trim() || null,
        github_url: normalizeUrl(githubUrl) || null,
        linkedin_url: normalizeUrl(linkedinUrl) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Save error:', error)
      toast.error('Save failed: ' + error.message)
    } else {
      setOriginalUsername(normalizedUsername)
      setUsername(normalizedUsername)
      setUsernameStatus('idle')
      setIsDirty(false)
      toast.success('Profile saved!')
    }

    setIsSaving(false)
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

  const previewName = displayName.trim() || username.trim() || 'Your Name'
  const previewUsername = username.trim() || 'username'
  const canViewLiveProfile = Boolean(username.trim())
  const previewBio = bio.trim() || 'Tell the Rolvibe community what you build and what people should know about you.'
  const previewLinks = [
    websiteUrl.trim() && {
      href: normalizeUrl(websiteUrl),
      label: normalizeUrl(websiteUrl).replace(/^https?:\/\//, '').replace(/\/$/, ''),
      icon: Globe,
    },
    twitterHandle.trim() && {
      href: `https://x.com/${twitterHandle.replace('@', '').trim()}`,
      label: `@${twitterHandle.replace('@', '').trim()}`,
      icon: Twitter,
    },
    githubUrl.trim() && {
      href: normalizeUrl(githubUrl),
      label: normalizeUrl(githubUrl).replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/'),
      icon: Github,
    },
    linkedinUrl.trim() && {
      href: normalizeUrl(linkedinUrl),
      label: normalizeUrl(linkedinUrl).replace(/^https?:\/\/(www\.)?linkedin\.com\//, 'linkedin.com/'),
      icon: Linkedin,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[]

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Avatar</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center ring-2 ring-[var(--border)] hover:ring-[#6B21E8] transition-all"
              >
                {avatarUploading ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{previewName.charAt(0).toUpperCase()}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center hover:bg-[var(--muted-surface)] transition-colors"
              >
                <Camera size={14} className="text-[var(--text-secondary)]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) void handleAvatarUpload(file)
                }}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Upload a profile photo</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                This image is shown on your public creator profile and around the app.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">JPG, PNG, WebP, or GIF. Max 5MB.</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Public Profile</h2>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={event => {
                setDisplayName(event.target.value)
                setIsDirty(true)
              }}
              placeholder="Your name"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={event => {
                  setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  setUsernameStatus('idle')
                  setIsDirty(true)
                }}
                onBlur={() => void validateUsername(username.trim().toLowerCase())}
                placeholder="yourhandle"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
              />
              {usernameIcon && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">{usernameIcon}</span>
              )}
            </div>
            <p className={`text-xs mt-1 ${
              usernameStatus === 'available' ? 'text-green-400' :
              usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-400' :
              'text-[var(--text-muted)]'
            }`}>
              {usernameHint}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
              <span className={`text-xs ${
                bio.length >= BIO_MAX ? 'text-red-400' :
                bio.length >= BIO_MAX * 0.85 ? 'text-yellow-400' :
                'text-[var(--text-muted)]'
              }`}>
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={event => {
                if (event.target.value.length <= BIO_MAX) {
                  setBio(event.target.value)
                  setIsDirty(true)
                }
              }}
              rows={4}
              placeholder="Tell the community what you build."
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Website URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={event => {
                setWebsiteUrl(event.target.value)
                setIsDirty(true)
              }}
              onBlur={() => setWebsiteUrl(value => normalizeUrl(value))}
              placeholder="https://yoursite.com"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Twitter / X Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
              <input
                type="text"
                value={twitterHandle}
                onChange={event => {
                  setTwitterHandle(event.target.value.replace(/^@+/, ''))
                  setIsDirty(true)
                }}
                placeholder="username"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={event => {
                setGithubUrl(event.target.value)
                setIsDirty(true)
              }}
              onBlur={() => setGithubUrl(value => normalizeUrl(value))}
              placeholder="https://github.com/username"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={event => {
                setLinkedinUrl(event.target.value)
                setIsDirty(true)
              }}
              onBlur={() => setLinkedinUrl(value => normalizeUrl(value))}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {isDirty ? (
            <p className="text-xs text-yellow-400 flex items-center gap-1.5">
              <AlertCircle size={12} />
              Unsaved changes
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Your public profile updates instantly after save.</p>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || avatarUploading || usernameStatus === 'taken' || usernameStatus === 'invalid'}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 self-start">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Live Preview</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">This is how your public creator profile will feel.</p>
            </div>
            {canViewLiveProfile ? (
              <Link
                href={`/creators/${previewUsername}`}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                View live
                <ExternalLink size={12} />
              </Link>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--background)]">
            <div className="h-24 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D9B]/35 via-[#6B21E8]/25 to-[#00B4FF]/20" />
            </div>

            <div className="px-5 pb-5">
              <div className="relative -mt-10 mb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--background)] bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white text-3xl font-bold">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={previewUsername} fill className="object-cover" />
                  ) : (
                    previewName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{previewName}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">@{previewUsername}</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">{previewBio}</p>

              {previewLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {previewLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#6B21E8]/40 transition-colors"
                    >
                      <Icon size={12} />
                      <span className="truncate max-w-[160px]">{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
