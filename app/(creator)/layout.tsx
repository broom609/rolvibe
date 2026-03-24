import { Navbar } from '@/components/nav/Navbar'
import { DashboardSidebar } from '@/components/nav/DashboardSidebar'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
