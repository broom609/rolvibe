import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Globe, Twitter, ShieldCheck } from 'lucide-react'
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
    .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white font-black text-3xl flex-shrink-0 overflow-hidden relative">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
          ) : (
            (profile.display_name || profile.username).charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#F4F4F5]">
              {profile.display_name || profile.username}
            </h1>
            {profile.is_verified && <ShieldCheck size={18} className="text-blue-400" />}
          </div>
          <p className="text-[#71717A] mb-2">@{profile.username}</p>
          {profile.bio && <p className="text-[#A1A1AA] text-sm mb-3 max-w-xl">{profile.bio}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-[#71717A]">
            <span>Joined {formatDate(profile.created_at)}</span>
            <span>{apps.length} apps</span>
            <span>{formatTryCount(totalTries)} total tries</span>
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#A1A1AA] transition-colors">
                <Globe size={13} /> Website
              </a>
            )}
            {profile.twitter_handle && (
              <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#A1A1AA] transition-colors">
                <Twitter size={13} /> @{profile.twitter_handle}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Apps grid */}
      <h2 className="text-lg font-semibold text-[#F4F4F5] mb-4">Apps by {profile.display_name || profile.username}</h2>
      {apps.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#A1A1AA]">No apps published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}
