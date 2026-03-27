import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldCheck, Zap, Github, Linkedin, Twitter, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppCard } from '@/components/feed/AppCard'
import { FollowCreatorButton } from '@/components/creator/FollowCreatorButton'
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
    description: data.profile.bio || `Discover vibes by @${data.profile.username} on Rolvibe.`,
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const data = await getCreatorData(username)
  if (!data) notFound()

  const { profile, apps } = data
  const totalTries = apps.reduce((sum, app) => sum + (app.try_count || 0), 0)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ count: followerCount }, followState] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('creator_id', profile.id),
    user
      ? supabase
          .from('follows')
          .select('creator_id')
          .eq('creator_id', profile.id)
          .eq('follower_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const isSelf = user?.id === profile.id
  const isFollowing = Boolean('data' in followState && followState.data)

  const socialLinks = [
    profile.github_url && {
      href: profile.github_url,
      icon: Github,
      label: profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/'),
      className: 'bg-[#24292e] text-white hover:bg-[#2f363d]',
    },
    profile.linkedin_url && {
      href: profile.linkedin_url,
      icon: Linkedin,
      label: profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/'),
      className: 'bg-[#0077b5] text-white hover:bg-[#006399]',
    },
    profile.twitter_handle && {
      href: `https://twitter.com/${profile.twitter_handle}`,
      icon: Twitter,
      label: `@${profile.twitter_handle}`,
      className: 'bg-black text-white hover:bg-[#1a1a1a]',
    },
    profile.website_url && {
      href: profile.website_url,
      icon: Globe,
      label: profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      className: 'bg-[#6B21E8] text-white hover:bg-[#5b18c8]',
    },
  ].filter(Boolean) as { href: string; icon: React.ElementType; label: string; className: string }[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Profile header card */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-[var(--card)] border border-[var(--border)]">
        {/* Gradient banner */}
        <div className="h-28 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D9B]/40 via-[#6B21E8]/30 to-[#00B4FF]/20" />
          <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(ellipse at 25% 60%, #FF2D9B 0%, transparent 55%), radial-gradient(ellipse at 75% 40%, #6B21E8 0%, transparent 55%)' }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="relative -mt-12 mb-4 inline-block">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-4xl overflow-hidden relative border-4 border-[var(--background)] ${
              profile.is_verified ? 'ring-2 ring-[#6B21E8]' : ''
            } bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8]`}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
              ) : (
                (profile.display_name || profile.username).charAt(0).toUpperCase()
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--background)] flex items-center justify-center">
                <ShieldCheck size={17} className="text-blue-400" />
              </div>
            )}
          </div>

          {/* Name + username */}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-3">@{profile.username}</p>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed mb-4">
              {profile.bio}
            </p>
          )}

          {/* Social badges */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {socialLinks.map(({ href, icon: Icon, label, className }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-90 ${className}`}
                >
                  <Icon size={12} />
                  <span className="truncate max-w-[160px]">{label}</span>
                </a>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>Member since {formatDate(profile.created_at)}</span>
            <span className="flex items-center gap-1">
              <Zap size={11} />
              {formatTryCount(totalTries)} total tries
            </span>
            <span>{followerCount || 0} followers</span>
            <span>{apps.length} {apps.length === 1 ? 'vibe' : 'vibes'}</span>
          </div>

          <div className="mt-4">
            <FollowCreatorButton
              creatorId={profile.id}
              initialFollowerCount={followerCount || 0}
              initialFollowing={isFollowing}
              isSelf={isSelf}
            />
          </div>
        </div>
      </div>

      {/* Apps grid */}
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Vibes by {profile.display_name || profile.username}
      </h2>
      {apps.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <p className="text-[var(--text-muted)] text-sm">No vibes yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}
