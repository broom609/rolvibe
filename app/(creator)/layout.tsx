import { Navbar } from '@/components/nav/Navbar'
import Link from 'next/link'
import { LayoutDashboard, PlusCircle, AppWindow, DollarSign, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/apps', label: 'My Apps', icon: AppWindow },
  { href: '/dashboard/submit', label: 'Submit App', icon: PlusCircle },
  { href: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card)] transition-colors"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
