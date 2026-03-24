'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/dashboard/submit', label: 'Submit', icon: Plus, cta: true },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Profile', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide on auth pages and dashboard (has its own nav)
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-[var(--border)]"
      style={{ backgroundColor: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {items.map(({ href, label, icon: Icon, exact, cta }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          const requiresAuth = href.startsWith('/dashboard')
          const linkHref = requiresAuth && !user ? `/login?next=${href}` : href

          if (cta) {
            return (
              <Link
                key={href}
                href={linkHref}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Icon size={20} className="text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={linkHref}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] transition-colors',
                isActive ? 'text-[#6B21E8]' : 'text-[var(--text-muted)]'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
