'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.error('useAuth profile load error:', error)
        setProfile(null)
        return
      }

      setProfile(data as Profile | null)
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await loadProfile(user)
      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Sign out failed: ' + error.message)
      return
    }

    setUser(null)
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return { user, profile, loading, signOut }
}
