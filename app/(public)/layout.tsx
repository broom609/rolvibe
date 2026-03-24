import { Navbar } from '@/components/nav/Navbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-[#2A2A30] mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF2D9B] via-[#6B21E8] to-[#00B4FF] flex items-center justify-center text-white font-black text-xs">R</div>
              <span className="text-sm font-semibold text-[#F4F4F5]">Rolvibe</span>
              <span className="text-xs text-[#71717A]">Where vibe coders get discovered.</span>
            </div>
            <div className="flex gap-5 text-xs text-[#71717A]">
              <a href="/about" className="hover:text-[#A1A1AA] transition-colors">About</a>
              <a href="/guidelines" className="hover:text-[#A1A1AA] transition-colors">Guidelines</a>
              <a href="/terms" className="hover:text-[#A1A1AA] transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-[#A1A1AA] transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
