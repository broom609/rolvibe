import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructWebhookEvent, getPlatformFeeCents, getStringMetadataValue, retrieveSubscriptionPeriodEnd } from '@/lib/stripe-marketplace'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = await constructWebhookEvent(payload, signature)
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const onboarded = Boolean(account.details_submitted && account.charges_enabled && account.payouts_enabled)

        await admin
          .from('profiles')
          .update({
            stripe_onboarded: onboarded,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', account.id)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const appId = getStringMetadataValue(session.metadata, 'app_id')
        const buyerId = getStringMetadataValue(session.metadata, 'buyer_id')
        const creatorId = getStringMetadataValue(session.metadata, 'creator_id')
        const pricingType = getStringMetadataValue(session.metadata, 'pricing_type')

        if (!appId || !buyerId || !creatorId || !pricingType) break

        if (session.mode === 'payment' && session.payment_status === 'paid') {
          const amountCents = session.amount_total || 0
          const platformFeeCents = getPlatformFeeCents(amountCents)
          await admin.from('purchases').upsert({
            app_id: appId,
            buyer_id: buyerId,
            creator_id: creatorId,
            amount_cents: amountCents,
            platform_fee_cents: platformFeeCents,
            creator_payout_cents: Math.max(0, amountCents - platformFeeCents),
            stripe_session_id: session.id,
            stripe_payment_intent:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
            status: 'completed',
          }, {
            onConflict: 'stripe_session_id',
          })
        }

        if (session.mode === 'subscription') {
          const currentPeriodEnd = await retrieveSubscriptionPeriodEnd(
            typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
          )

          await admin.from('subscriptions').upsert({
            app_id: appId,
            subscriber_id: buyerId,
            creator_id: creatorId,
            stripe_subscription_id:
              typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null,
            status: 'active',
            current_period_end: currentPeriodEnd,
          }, {
            onConflict: 'stripe_subscription_id',
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        await admin
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
            current_period_end: currentPeriodEnd,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('Stripe webhook processing failed', { type: event.type, error })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
