'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'

export function useFavorite(appId: string, initialCount: number) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [count, setCount] = useState(initialCount)

  async function toggle() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Sign in to save apps')
      return
    }

    const optimisticFavorited = !isFavorited
    setIsFavorited(optimisticFavorited)
    setCount(c => optimisticFavorited ? c + 1 : c - 1)

    try {
      const res = await fetch(`/api/apps/${appId}/favorite`, { method: 'POST' })
      if (!res.ok) throw new Error()
      track(optimisticFavorited ? 'app_favorited' : 'app_unfavorited', { app_id: appId })
    } catch {
      setIsFavorited(!optimisticFavorited)
      setCount(c => optimisticFavorited ? c - 1 : c + 1)
      toast.error('Failed to update favorite')
    }
  }

  return { isFavorited, count, toggle }
}
