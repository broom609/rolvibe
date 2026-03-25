import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Globe, Twitter, ShieldCheck, Zap, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppCard } from '@/components/feed/AppCard'
import { formatTryCount, formatDate } from '@/lib/utils'
import type { App, Profile } from '@/types'

async function getCreatorData(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return null

  const { data: apps } = await supabase
    .from('apps')
    .select('*, creator:profiles!apps_creator_id_fkey(id, username, display_name, avatar_url, is_verified)')
    .eq('creator_id', profile.id)
    .eq('status', 'active')
    .order('score', { ascending: false })

  return { profile: profile as Profile, apps: (apps || []) as App[] }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const data = await getCreatorData(username)
  if (!data) return { title: 'Creator Not Found — Rolvibe' }
  return {
    title: `${data.profile.display_name || data.profile.username} — Rolvibe`,
    description: data.profile.bio || `Discover apps by @${data.profile.username} on Rolvibe.`,
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const data = await getCreatorData(username)
  if (!data) notFound()

  const { profile, apps } = data
  const totalTries = apps.reduce((sum, app) => sum + (app.try_count || 0), 0)
  const totalSaves = apps.reduce((sum, app) => sum + (app.favorite_count || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-[var(--card)] border border-[var(--border)]">
        {/* Gradient background */}
        <div className="h-32 bg-gradient-to-br from-[#FF2D9B]/30 via-[#6B21E8]/20 to-[#00B4FF]/20 relative">
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 30% 50%, #FF2D9B 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #6B21E8 0%, transparent 60%)' }} />
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          {/* Avatar — overlaps banner */}
          <div className="relative -mt-14 mb-4 inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white font-black text-4xl flex-shrink-0 overflow-hidden relative border-4 border-[var(--background)]">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
              ) : (
                (profile.display_name || profile.username).charAt(0).toUpperCase()
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--background)] flex items-center justify-center">
                <ShieldCheck size={18} className="text-blue-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-[var(--text-muted)] text-sm mb-3">@{profile.username}</p>
              {profile.bio && (
                <p className="text-[var(--text-secondary)] text-sm max-w-lg leading-relaxed mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Globe size={14} />
                    {profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
                {profile.twitter_handle && (
                  <a
                    href={`https://twitter.com/${profile.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#1d9bf0] transition-colors"
                  >
                    <Twitter size={14} />
                    @{profile.twitter_handle}
                  </a>
                )}
                <span className="text-sm text-[var(--text-muted)]">
                  Member since {formatDate(profile.created_at)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 sm:flex-col sm:items-end">
              <div className="flex gap-3">
                <div className="bg-[var(--muted-surface)] rounded-xl px-4 py-3 text-center min-w-[72px]">
                  <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] mb-1">
                    <Zap size={12} />
                  </div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{formatTryCount(totalTries)}</p>
                  <p className="text-xs text-[var(--text-muted)]">total tries</p>
                </div>
                <div className="bg-[var(--muted-surface)] rounded-xl px-4 py-3 text-center min-w-[72px]">
                  <div className="flex items-center justify-center gap-1 text-pink-400 mb-1">
                    <Heart size={12} />
                  </div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{formatTryCount(totalSaves)}</p>
                  <p className="text-xs text-[var(--text-muted)]">total saves</p>
                </div>
                <div className="bg-[var(--muted-surface)] rounded-xl px-4 py-3 text-center min-w-[60px]">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{apps.length}</p>
                  <p className="text-xs text-[var(--text-muted)]">apps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apps grid */}
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Apps by {profile.display_name || profile.username}
      </h2>
      {apps.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <p className="text-[var(--text-muted)] text-sm">No apps published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}
