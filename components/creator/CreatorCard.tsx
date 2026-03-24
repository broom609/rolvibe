import Image from 'next/image'
import Link from 'next/link'
import { Globe, Twitter, ShieldCheck } from 'lucide-react'
import { Profile } from '@/types'
import { formatDate } from '@/lib/utils'

interface CreatorCardProps {
  creator: Profile
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden relative">
          {creator.avatar_url ? (
            <Image src={creator.avatar_url} alt={creator.username} fill className="object-cover" />
          ) : (
            (creator.display_name || creator.username).charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {creator.display_name || creator.username}
            </p>
            {creator.is_verified && <ShieldCheck size={14} className="text-blue-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-[var(--text-muted)]">@{creator.username}</p>
        </div>
      </div>

      {creator.bio && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-3">{creator.bio}</p>
      )}

      <p className="text-xs text-[var(--text-muted)] mb-3">Joined {formatDate(creator.created_at)}</p>

      <div className="flex gap-2 flex-wrap">
        {creator.website_url && (
          <a href={creator.website_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <Globe size={12} /> Website
          </a>
        )}
        {creator.twitter_handle && (
          <a href={`https://twitter.com/${creator.twitter_handle}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <Twitter size={12} /> @{creator.twitter_handle}
          </a>
        )}
      </div>

      <Link
        href={`/creators/${creator.username}`}
        className="mt-3 block text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg py-1.5 transition-colors"
      >
        View Profile →
      </Link>
    </div>
  )
}
