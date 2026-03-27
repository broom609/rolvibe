import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { App, Profile } from '@/types'
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export function getPlatformFeeCents(amountCents: number) {
  return Math.max(0, Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100)))
}

export function getAppSuccessPath(app: App) {
  return `/apps/${app.slug}?checkout=success`
}

export function getAppCancelPath(app: App) {
  return `/apps/${app.slug}?checkout=cancelled`
}

export function isStripeMonetizedApp(app: App) {
  return app.pricing_type === 'paid' || app.pricing_type === 'subscription'
}

export async function ensureStripeCatalogForApp(
  admin: SupabaseClient,
  app: App,
  creator: Profile
) {
  if (!isStripeMonetizedApp(app)) {
    return { productId: null, priceId: null }
  }

  let productId = app.stripe_product_id || null
  let priceId = app.stripe_price_id || null

  if (!productId) {
    const product = await stripe.products.create({
      name: app.name,
      description: app.tagline,
      url: app.app_url,
      metadata: {
        app_id: app.id,
        creator_id: creator.id,
      },
      images: app.thumbnail_url ? [app.thumbnail_url] : undefined,
    })
    productId = product.id
  }

  const expectedAmount =
    app.pricing_type === 'paid'
      ? app.price_cents
      : app.pricing_type === 'subscription'
        ? app.subscription_price_cents
        : null

  if (!expectedAmount) {
    return { productId, priceId: null }
  }

  let shouldCreatePrice = !priceId
  if (priceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(priceId)
      shouldCreatePrice =
        existingPrice.unit_amount !== expectedAmount ||
        existingPrice.recurring?.interval !== (app.pricing_type === 'subscription' ? 'month' : undefined)
    } catch {
      shouldCreatePrice = true
    }
  }

  if (shouldCreatePrice) {
    const price = await stripe.prices.create({
      product: productId,
      currency: 'usd',
      unit_amount: expectedAmount,
      recurring: app.pricing_type === 'subscription' ? { interval: 'month' } : undefined,
      metadata: {
        app_id: app.id,
        creator_id: creator.id,
      },
    })
    priceId = price.id
  }

  await admin
    .from('apps')
    .update({
      stripe_product_id: productId,
      stripe_price_id: priceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app.id)

  return { productId, priceId }
}

export async function createOrFetchStripeCustomer(email: string | undefined, metadata: Record<string, string>) {
  if (!email) return null

  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data[0]) return existing.data[0]

  return stripe.customers.create({
    email,
    metadata,
  })
}

export async function retrieveSubscriptionPeriodEnd(subscriptionId: string | null | undefined) {
  if (!subscriptionId) return null
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null
  } catch {
    return null
  }
}

export async function createConnectOnboardingLink(args: {
  accountId: string
  refreshUrl: string
  returnUrl: string
}) {
  return stripe.accountLinks.create({
    account: args.accountId,
    refresh_url: args.refreshUrl,
    return_url: args.returnUrl,
    type: 'account_onboarding',
  })
}

export async function createConnectedAccountForProfile(userId: string, email: string | undefined, appUrl: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      user_id: userId,
    },
    business_profile: {
      url: appUrl,
      product_description: 'AI apps sold through Rolvibe',
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

export async function getStripeAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  const onboarded = Boolean(account.details_submitted && account.charges_enabled && account.payouts_enabled)
  return { account, onboarded }
}

export async function constructWebhookEvent(payload: string, signature: string) {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}

export type StripeCheckoutMetadata = {
  app_id: string
  app_slug: string
  buyer_id: string
  creator_id: string
  pricing_type: App['pricing_type']
}

export function getCheckoutMetadata(app: App, buyerId: string): StripeCheckoutMetadata {
  return {
    app_id: app.id,
    app_slug: app.slug,
    buyer_id: buyerId,
    creator_id: app.creator_id,
    pricing_type: app.pricing_type,
  }
}

export function getStringMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' ? value : null
}
