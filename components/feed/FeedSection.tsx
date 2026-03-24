import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { App } from '@/types'
import { AppCard } from './AppCard'
import { SkeletonCard } from './SkeletonCard'

interface FeedSectionProps {
  title: string
  apps: App[]
  loading?: boolean
  href?: string
  size?: 'normal' | 'featured'
}

export function FeedSection({ title, apps, loading, href, size = 'normal' }: FeedSectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F4F4F5]">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors">
            Browse all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 snap-start">
                <SkeletonCard />
              </div>
            ))
          : apps.map(app => (
              <div key={app.id} className={`flex-shrink-0 snap-start ${size === 'featured' ? 'w-80' : 'w-64'}`}>
                <AppCard app={app} size={size} />
              </div>
            ))
        }
        {!loading && apps.length === 0 && (
          <p className="text-sm text-[#71717A] py-4">Nothing here yet.</p>
        )}
      </div>
    </section>
  )
}
