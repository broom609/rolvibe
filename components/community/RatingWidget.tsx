'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface RatingWidgetProps {
  appId: string
  isAuthed: boolean
}

export function RatingWidget({ appId, isAuthed }: RatingWidgetProps) {
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/apps/${appId}/rate`)
      .then(r => r.json())
      .then(d => {
        setAverage(d.average ?? 0)
        setCount(d.count ?? 0)
        setUserRating(d.userRating ?? null)
      })
  }, [appId])

  async function handleRate(star: number) {
    if (!isAuthed) return
    setSubmitting(true)
    const res = await fetch(`/api/apps/${appId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: star }),
    })
    if (res.ok) {
      const d = await res.json()
      setAverage(d.average)
      setCount(d.count)
      setUserRating(d.userRating)
      toast.success('Thanks for rating!')
    }
    setSubmitting(false)
  }

  const displayStars = hover || userRating || 0

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Rate this Vibe</h3>
        {count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium text-[var(--text-secondary)]">{average.toFixed(1)}</span>
            <span>({count})</span>
          </div>
        )}
      </div>

      {isAuthed ? (
        <div>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onClick={() => handleRate(star)}
                disabled={submitting}
                className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  size={22}
                  className={cn(
                    'transition-colors',
                    displayStars >= star ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--border)]'
                  )}
                />
              </button>
            ))}
          </div>
          {userRating && (
            <p className="text-xs text-[var(--text-muted)] mt-2">You rated this {userRating}/5</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/login" className="text-[#6B21E8] hover:underline">Sign in</Link> to rate this vibe
        </p>
      )}
    </div>
  )
}
