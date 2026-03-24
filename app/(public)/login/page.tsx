'use client'

import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getClientAuthOrigin, normalizeNextPath } from '@/lib/auth'
import { Loader2, Zap, Shield, Globe } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = normalizeNextPath(searchParams.get('next'))
  const authOrigin = getClientAuthOrigin()
  const authRedirect = `${authOrigin}/auth/callback?next=${next}`

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(next)
    })
  }, [next, router])

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirect },
    })
    setLoading(false)
    if (error) toast.error(error.message)
    else setSent(true)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirect },
    })
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0E0E10 0%, #16101F 50%, #0A1020 100%)' }}>
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #FF2D9B, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-25" style={{ background: 'radial-gradient(circle, #6B21E8, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00B4FF, transparent 70%)', filter: 'blur(80px)' }} />

        <div className="relative z-10 max-w-sm">
          <RolvibeLogo size={52} withWordmark className="mb-10" />

          <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
            Where vibe coders<br />get discovered.
          </h2>
          <p className="text-[#A1A1AA] mb-10 text-sm leading-relaxed">
            The marketplace for AI-built apps. Try hundreds of tools, save your favorites, and share what you&apos;ve made.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Try apps without signing up' },
              { icon: Shield, text: 'Magic link — no password needed' },
              { icon: Globe, text: 'Submit your own vibe-coded apps' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-[#6B21E8]" />
                </div>
                <p className="text-sm text-[#A1A1AA]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--background)]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <RolvibeLogo size={52} className="justify-center mb-3" priority />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Sign in to Rolvibe</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Discover and share vibe-coded apps</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)]">Sign in or create your account</p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✉️</span>
                </div>
                <p className="text-[var(--text-primary)] font-semibold mb-1">Check your email</p>
                <p className="text-sm text-[var(--text-secondary)] mb-1">We sent a magic link to</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{email}</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-muted)]">or</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/50 transition-colors"
                  />
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : 'Send Magic Link'}
                  </button>
                </form>
              </>
            )}
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            By signing in, you agree to our{' '}
            <a href="/terms" className="hover:text-[var(--text-secondary)] underline">Terms</a>{' '}and{' '}
            <a href="/privacy" className="hover:text-[var(--text-secondary)] underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#6B21E8]" size={32} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
