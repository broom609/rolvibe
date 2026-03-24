import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const adminClient = createAdminClient()

      // Check if profile exists
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile
        const email = user.email || ''
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const baseUsername = (googleName || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 20) || 'user'

        // Ensure unique username
        let username = baseUsername
        let suffix = 0
        while (true) {
          const { data: taken } = await adminClient
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single()
          if (!taken) break
          suffix++
          username = `${baseUsername}${suffix}`
        }

        await adminClient.from('profiles').insert({
          id: user.id,
          username,
          display_name: googleName || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'user',
        })

        // Send welcome email
        try {
          await sendWelcomeEmail(email, username)
        } catch {
          // Non-fatal
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
