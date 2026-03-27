'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, PlusCircle, AppWindow, DollarSign, Settings, UserCircle2, Shield, LogOut, Menu, X, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/apps', label: 'My Apps', icon: AppWindow },
  { href: '/dashboard/submit', label: 'Submit App', icon: PlusCircle },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle2 },
  { href: '/dashboard/library', label: 'Library', icon: Bookmark },
  { href: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = navItems.map(({ href, label, icon: Icon, exact }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href)

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
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
  })

  return (
    <>
      <div className="md:hidden w-full">
        <button
          type="button"
          onClick={() => setMobileOpen(open => !open)}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]"
        >
          <span className="flex items-center gap-2">
            <Menu size={16} className="text-[var(--text-muted)]" />
            Dashboard Menu
          </span>
          {mobileOpen ? <X size={16} className="text-[var(--text-muted)]" /> : null}
        </button>

        {mobileOpen && (
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 space-y-1.5">
            {navLinks}
            <div className="border-t border-[var(--border)] my-3" />
            {profile?.role === 'admin' && (
              <Link
                href="/admin/queue"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                <Shield size={16} />
                Admin Panel
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                setMobileOpen(false)
                await signOut()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      <aside className="w-52 flex-shrink-0 hidden md:flex md:flex-col">
        <nav className="space-y-0.5">
          {navLinks}
        </nav>

        <div className="border-t border-[var(--border)] my-4" />

        <div className="space-y-2">
          {profile?.role === 'admin' && (
            <Link
              href="/admin/queue"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <Shield size={16} />
              Admin Panel
            </Link>
          )}

          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} className="text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
