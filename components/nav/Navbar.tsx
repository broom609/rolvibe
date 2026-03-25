'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, Plus, User, LogOut, Settings, LayoutDashboard, BookOpen, Zap } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur border-b border-[var(--border)]"
      style={{ backgroundColor: 'var(--nav-bg)' }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <RolvibeLogo size={36} withWordmark priority wordmarkClassName="hidden sm:block" />
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] rounded-lg transition-colors"
          >
            Discover
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] rounded-lg cursor-not-allowed select-none">
            <Zap size={13} />
            Challenges
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#6B21E8]/20 text-[#a78bfa] border border-[#6B21E8]/30 leading-none">
              SOON
            </span>
          </div>
          <Link
            href={user ? '/dashboard/apps' : '/login?next=/dashboard/apps'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] rounded-lg transition-colors"
          >
            <BookOpen size={13} />
            My Library
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <ThemeToggle />

          {user && (
            <button
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
          )}

          <Link href="/dashboard/submit" className="btn-primary text-sm py-1.5 px-3 hidden sm:flex">
            <Plus size={14} />
            List App
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white text-sm font-semibold overflow-hidden relative"
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username || ''} fill className="object-cover" />
                ) : (
                  (profile?.display_name || profile?.username || user.email || 'U').charAt(0).toUpperCase()
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {profile?.display_name || profile?.username || user.email}
                    </p>
                    {profile?.username && (
                      <p className="text-xs text-[var(--text-muted)] truncate">@{profile.username}</p>
                    )}
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link href="/admin/queue" className="flex items-center gap-2.5 px-3 py-2 text-sm text-pink-400 hover:text-pink-300 hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                      <User size={14} /> Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-[var(--border)] mt-1 pt-1">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
