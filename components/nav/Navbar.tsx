'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, Plus, LogOut, Settings, LayoutDashboard, Search, User, Shield, PencilLine, Bookmark } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const publicProfileHref = profile?.username ? `/creators/${profile.username}` : null
  const isAdmin = profile?.role === 'admin'

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
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <RolvibeLogo size={32} withWordmark priority wordmarkClassName="hidden sm:block" />
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] rounded-lg transition-colors"
          >
            Discover
          </Link>
          <Link
            href="/trending"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] rounded-lg transition-colors"
          >
            Trending
          </Link>
          <Link
            href="/new"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] rounded-lg transition-colors"
          >
            New
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <ThemeToggle />

          {/* Search icon */}
          <button
            onClick={() => router.push('/search')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          <Link href="/dashboard/submit" className="btn-primary text-sm py-1.5 px-3 hidden sm:flex items-center gap-1">
            <Plus size={14} />
            List App
          </Link>

          {user && (
            <button
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
          )}

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
                <div className="absolute right-0 top-10 w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {profile?.username ? `@${profile.username}` : user.email}
                    </p>
                    {profile?.display_name && (
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile.display_name}</p>
                    )}
                  </div>

                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <PencilLine size={14} /> Edit Profile
                  </Link>
                  {publicProfileHref && (
                    <Link
                      href={publicProfileHref}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={14} /> View Public Profile
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link
                    href="/dashboard/library"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Bookmark size={14} /> Library
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={14} /> Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/queue"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-pink-400 hover:text-pink-300 hover:bg-[var(--muted-surface)] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield size={14} /> Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-[var(--border)] mt-1 pt-1">
                    <button
                      onClick={async () => {
                        setMenuOpen(false)
                        await signOut()
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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
