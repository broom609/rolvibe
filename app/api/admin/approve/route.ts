import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAppApprovedEmail } from '@/lib/resend'
import type { App, Profile } from '@/types'
import { computeAppReview, runAppHealthCheck } from '@/lib/app-review'
import { ensureStripeCatalogForApp, isStripeMonetizedApp } from '@/lib/stripe-marketplace'

export async function POST(request: NextRequest) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { app_id } = await request.json()
  const admin = createAdminClient()

  const { data: appData, error: fetchError } = await admin
    .from('apps')
    .select('*, creator:profiles(*)')
    .eq('id', app_id)
    .single()

  if (fetchError || !appData) {
    return NextResponse.json({ error: fetchError?.message || 'App not found' }, { status: 400 })
  }

  const app = appData as App
  const creator = app.creator as Profile | undefined
  if (!creator) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 400 })
  }

  if (isStripeMonetizedApp(app) && (!creator.stripe_account_id || !creator.stripe_onboarded)) {
    return NextResponse.json({ error: 'Creator must finish Stripe onboarding before approving a paid app' }, { status: 400 })
  }

  if (isStripeMonetizedApp(app)) {
    await ensureStripeCatalogForApp(admin, app, creator)
  }

  const review = computeAppReview(app)
  const health = await runAppHealthCheck(app.app_url)

  await admin.from('app_reviews').upsert({
    app_id: app.id,
    ...review,
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const { data: updatedApp, error } = await admin
    .from('apps')
    .update({
      status: 'active',
      published_at: new Date().toISOString(),
      score: review.overall_score,
      health_status: health.health_status,
      last_health_check: new Date().toISOString(),
      admin_notes: health.admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app_id)
    .select('*, creator:profiles(id)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Get creator email from auth
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(app.creator_id)
    if (authUser.user?.email) {
      await sendAppApprovedEmail(authUser.user.email, app.name, app.slug)
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true, app: updatedApp, review })
}
