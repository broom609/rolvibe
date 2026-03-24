import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthOrigin, normalizeNextPath } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = normalizeNextPath(searchParams.get('next'))
  const appOrigin = getServerAuthOrigin(request.url)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback: session exchange failed', {
        message: error.message,
        next,
        requestUrl: request.url,
      })
    }

    if (!error && data.user) {
      const user = data.user
      const email = user.email || ''

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Auth callback: SUPABASE_SERVICE_ROLE_KEY is missing; skipping profile bootstrap', {
          userId: user.id,
          next,
        })
      } else {
        try {
          const adminClient = createAdminClient()

          const { data: existingProfile, error: profileLookupError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

          if (profileLookupError && profileLookupError.code !== 'PGRST116') {
            console.error('Auth callback: profile lookup failed', {
              userId: user.id,
              message: profileLookupError.message,
            })
          }

          if (!existingProfile) {
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name || ''
            const baseUsername = (googleName || email.split('@')[0])
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 20) || 'user'

            let username = baseUsername
            let suffix = 0

            while (true) {
              const { data: taken, error: usernameLookupError } = await adminClient
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single()

              if (usernameLookupError && usernameLookupError.code !== 'PGRST116') {
                console.error('Auth callback: username lookup failed', {
                  userId: user.id,
                  username,
                  message: usernameLookupError.message,
                })
                break
              }

              if (!taken) break

              suffix++
              username = `${baseUsername}${suffix}`
            }

            const { error: profileInsertError } = await adminClient.from('profiles').insert({
              id: user.id,
              username,
              display_name: googleName || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              role: 'user',
            })

            if (profileInsertError) {
              console.error('Auth callback: profile insert failed', {
                userId: user.id,
                username,
                message: profileInsertError.message,
              })
            } else {
              try {
                await sendWelcomeEmail(email, username)
              } catch (welcomeEmailError) {
                console.error('Auth callback: welcome email failed', {
                  userId: user.id,
                  message: welcomeEmailError instanceof Error ? welcomeEmailError.message : 'Unknown error',
                })
              }
            }
          }
        } catch (profileBootstrapError) {
          console.error('Auth callback: unexpected profile bootstrap error', {
            userId: user.id,
            message: profileBootstrapError instanceof Error ? profileBootstrapError.message : 'Unknown error',
          })
        }
      }

      return NextResponse.redirect(`${appOrigin}${next}`)
    }
  }

  console.error('Auth callback: missing code or user', {
    hasCode: Boolean(code),
    next,
    requestUrl: request.url,
  })

  return NextResponse.redirect(`${appOrigin}/login?error=auth_failed`)
}
