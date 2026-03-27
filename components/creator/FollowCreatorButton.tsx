'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowCreatorButtonProps {
  creatorId: string
  initialFollowerCount?: number
  initialFollowing?: boolean
  isSelf?: boolean
  compact?: boolean
}

export function FollowCreatorButton({
  creatorId,
  initialFollowerCount = 0,
  initialFollowing = false,
  isSelf = false,
  compact = false,
}: FollowCreatorButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  if (isSelf) return null

  async function toggleFollow() {
    setLoading(true)
    const res = await fetch(`/api/creators/${creatorId}/follow`, {
      method: isFollowing ? 'DELETE' : 'POST',
    })
    const body = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('Sign in to follow creators')
        return
      }
      toast.error(body.error || 'Could not update follow status')
      return
    }

    setIsFollowing(Boolean(body.isFollowing))
    setFollowerCount(body.followerCount || 0)
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60',
        compact ? 'px-3 py-2' : 'px-4 py-2.5',
        isFollowing
          ? 'border-[var(--border)] bg-[var(--muted-surface)] text-[var(--text-primary)]'
          : 'border-[#6B21E8]/30 bg-[#6B21E8]/10 text-[#9f7aea] hover:bg-[#6B21E8]/15'
      )}
    >
      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      <span>{isFollowing ? 'Following' : 'Follow'}</span>
      <span className="text-xs opacity-80">{followerCount}</span>
    </button>
  )
}
