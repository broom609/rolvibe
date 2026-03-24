'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, Plus, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

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
          <RolvibeLogo
            size={48}
            withWordmark
            priority
            wordmarkClassName="hidden sm:block"
          />
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={15} />
            <input
              type="search"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          <Link
            href="/dashboard/submit"
            className="btn-primary text-sm py-2 px-3 hidden sm:flex"
          >
            <Plus size={15} />
            List App
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username || ''} fill className="object-cover" />
                ) : (
                  (profile?.display_name || profile?.username || user.email || 'U').charAt(0).toUpperCase()
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {profile?.display_name || profile?.username || user.email}
                    </p>
                    {profile?.username && (
                      <p className="text-xs text-[var(--text-muted)] truncate">@{profile.username}</p>
                    )}
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link href="/admin/queue" className="flex items-center gap-2 px-3 py-2 text-sm text-pink-400 hover:text-pink-300 hover:bg-[var(--muted-surface)] transition-colors" onClick={() => setMenuOpen(false)}>
                      <User size={14} /> Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
