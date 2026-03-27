import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireApiUser } from '@/lib/admin'
import { getServerAuthOrigin } from '@/lib/auth'
import type { App, Profile } from '@/types'
import {
  createOrFetchStripeCustomer,
  ensureStripeCatalogForApp,
  getAppCancelPath,
  getAppSuccessPath,
  getCheckoutMetadata,
  getPlatformFeeCents,
} from '@/lib/stripe-marketplace'
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const { user } = auth
  const admin = createAdminClient()
  const { data: appData, error } = await admin
    .from('apps')
    .select('*, creator:profiles(*)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !appData) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  const app = appData as App
  const creator = app.creator as Profile | undefined
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 400 })
  }

  if (creator.id === user.id) {
    return NextResponse.json({ url: app.app_url, alreadyOwned: true })
  }

  if (app.pricing_type === 'free') {
    return NextResponse.json({ url: app.app_url, alreadyOwned: true })
  }

  if (app.pricing_type === 'coming_soon' || app.pricing_type === 'invite_only') {
    return NextResponse.json({ error: 'This app is not currently purchasable' }, { status: 400 })
  }

  if (!creator.stripe_account_id || !creator.stripe_onboarded) {
    return NextResponse.json({ error: 'Creator payouts are not configured yet' }, { status: 400 })
  }

  if (app.pricing_type === 'paid') {
    const { data: purchase } = await admin
      .from('purchases')
      .select('id')
      .eq('app_id', app.id)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (purchase) {
      return NextResponse.json({ url: app.app_url, alreadyOwned: true })
    }
  }

  if (app.pricing_type === 'subscription') {
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('id')
      .eq('app_id', app.id)
      .eq('subscriber_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subscription) {
      return NextResponse.json({ url: app.app_url, alreadyOwned: true })
    }
  }

  const { priceId } = await ensureStripeCatalogForApp(admin, app, creator)
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price is not configured for this app' }, { status: 400 })
  }

  const origin = getServerAuthOrigin(request.url)
  const customer = await createOrFetchStripeCustomer(user.email, {
    user_id: user.id,
  })
  const metadata = getCheckoutMetadata(app, user.id)

  const baseSessionParams = {
    customer: customer?.id,
    customer_email: customer ? undefined : user.email,
    success_url: `${origin}${getAppSuccessPath(app)}`,
    cancel_url: `${origin}${getAppCancelPath(app)}`,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    allow_promotion_codes: true,
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>

  if (app.pricing_type === 'paid') {
    const amountCents = app.price_cents || 0
    const session = await stripe.checkout.sessions.create({
      ...baseSessionParams,
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: getPlatformFeeCents(amountCents),
        transfer_data: {
          destination: creator.stripe_account_id,
        },
        metadata,
      },
    })

    return NextResponse.json({ url: session.url })
  }

  const session = await stripe.checkout.sessions.create({
    ...baseSessionParams,
    mode: 'subscription',
    subscription_data: {
      application_fee_percent: PLATFORM_FEE_PERCENT,
      transfer_data: {
        destination: creator.stripe_account_id,
      },
      metadata,
    },
  })

  return NextResponse.json({ url: session.url })
}
