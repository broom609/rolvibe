'use client'

import { RolvibeLogo } from '@/components/brand/RolvibeLogo'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
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
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <RolvibeLogo
            size={64}
            className="justify-center mb-4"
            iconClassName="scale-[1.08] brightness-125 contrast-125 saturate-150"
            priority
          />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Sign in to Rolvibe</h1>
          <p className="text-sm text-[var(--text-secondary)]">Discover and share vibe-coded apps</p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-[var(--text-primary)] font-medium mb-2">Check your email ✉️</p>
              <p className="text-sm text-[var(--text-secondary)]">We sent a magic link to <strong>{email}</strong></p>
              <button onClick={() => setSent(false)} className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Try a different email</button>
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
                <div className="flex-1 h-px bg-[var(--muted-surface)]" />
                <span className="text-xs text-[var(--text-muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--muted-surface)]" />
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
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-[#6B21E8]" size={32} /></div>}>
      <LoginForm />
    </Suspense>
  )
}
