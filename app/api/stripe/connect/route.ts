import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/admin'
import { getServerAuthOrigin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createConnectedAccountForProfile,
  createConnectOnboardingLink,
  getStripeAccountStatus,
} from '@/lib/stripe-marketplace'

export async function GET(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const { user, profile } = auth
  const admin = createAdminClient()
  const origin = getServerAuthOrigin(request.url)
  const returnUrl = `${origin}/dashboard/earnings?stripe=return`
  const refreshUrl = `${origin}/api/stripe/connect?refresh=1`

  let accountId = profile?.stripe_account_id || null

  if (!accountId) {
    const account = await createConnectedAccountForProfile(
      user.id,
      user.email,
      `${origin}/creators/${profile?.username || user.id}`
    )
    accountId = account.id

    const { error } = await admin
      .from('profiles')
      .update({
        stripe_account_id: accountId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Stripe connect: failed to save account id', error)
      return NextResponse.redirect(`${origin}/dashboard/earnings?stripe=error`)
    }
  }

  try {
    const { onboarded } = await getStripeAccountStatus(accountId)

    await admin
      .from('profiles')
      .update({
        stripe_onboarded: onboarded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (onboarded) {
      return NextResponse.redirect(`${origin}/dashboard/earnings?stripe=ready`)
    }

    const link = await createConnectOnboardingLink({
      accountId,
      refreshUrl,
      returnUrl,
    })

    return NextResponse.redirect(link.url)
  } catch (error) {
    console.error('Stripe connect: onboarding link creation failed', error)
    return NextResponse.redirect(`${origin}/dashboard/earnings?stripe=error`)
  }
}
