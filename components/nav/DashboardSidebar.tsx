'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, AppWindow, DollarSign, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/apps', label: 'My Apps', icon: AppWindow },
  { href: '/dashboard/submit', label: 'Submit App', icon: PlusCircle },
  { href: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 hidden md:block">
      <nav className="space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)]'
              )}
            >
              <Icon
                size={15}
                className={isActive ? 'text-[#6B21E8]' : 'text-[var(--text-muted)]'}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
