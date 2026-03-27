import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAppRejectedEmail } from '@/lib/resend'
import type { App } from '@/types'
import { computeAppReview } from '@/lib/app-review'

export async function POST(request: NextRequest) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { app_id, reason } = await request.json()
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('apps')
    .select('*')
    .eq('id', app_id)
    .single()

  const review = existing ? computeAppReview(existing as App) : null
  if (review) {
    await admin.from('app_reviews').upsert({
      app_id,
      ...review,
      checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  const { data: app, error } = await admin
    .from('apps')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      score: review?.overall_score ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(app.creator_id)
    if (authUser.user?.email) {
      await sendAppRejectedEmail(authUser.user.email, app.name, reason)
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true })
}
