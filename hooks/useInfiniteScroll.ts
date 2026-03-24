'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { App, FeedCursor } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface UseInfiniteScrollOptions {
  category?: string
  pageSize?: number
}

export function useInfiniteScroll({ category, pageSize = 12 }: UseInfiniteScrollOptions = {}) {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<FeedCursor | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = useCallback(async (cur: FeedCursor | null, reset = false) => {
    const supabase = createClient()

    let query = supabase
      .from('apps')
      .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
      .eq('status', 'active')
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(pageSize)

    if (category) {
      query = query.eq('category', category)
    }

    if (cur) {
      query = query.lt('score', cur.score)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
      return
    }

    const items = (data || []) as App[]
    setApps(prev => reset ? items : [...prev, ...items])
    setHasMore(items.length === pageSize)

    if (items.length > 0) {
      const last = items[items.length - 1]
      setCursor({ score: last.score, published_at: last.published_at || last.created_at })
    }
  }, [category, pageSize])

  // Initial load
  useEffect(() => {
    setLoading(true)
    setCursor(null)
    setApps([])
    setHasMore(true)
    fetchPage(null, true).finally(() => setLoading(false))
  }, [category, fetchPage])

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore) {
          setLoadingMore(true)
          await fetchPage(cursor)
          setLoadingMore(false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, fetchPage])

  function retry() {
    setError(null)
    setLoading(true)
    fetchPage(null, true).finally(() => setLoading(false))
  }

  return { apps, loading, loadingMore, error, hasMore, sentinelRef, retry }
}
