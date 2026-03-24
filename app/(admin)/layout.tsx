import { Navbar } from '@/components/nav/Navbar'
import Link from 'next/link'
import { Shield, List, AppWindow, Users, Flag } from 'lucide-react'

const adminNav = [
  { href: '/admin/queue', label: 'Review Queue', icon: List },
  { href: '/admin/apps', label: 'All Apps', icon: AppWindow },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <div className="flex items-center gap-2 mb-4 px-3">
            <Shield size={14} className="text-pink-400" />
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Admin</span>
          </div>
          <nav className="space-y-1">
            {adminNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1E] transition-colors"
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
