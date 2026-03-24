import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { Navbar } from '@/components/nav/Navbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-[var(--border)] mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <RolvibeLogo
                size={36}
                withWordmark
                wordmarkClassName="text-sm font-semibold"
              />
              <span className="text-xs text-[var(--text-muted)]">Where vibe coders get discovered.</span>
            </div>
            <div className="flex gap-5 text-xs text-[var(--text-muted)]">
              <a href="/about" className="hover:text-[var(--text-secondary)] transition-colors">About</a>
              <a href="/guidelines" className="hover:text-[var(--text-secondary)] transition-colors">Guidelines</a>
              <a href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
