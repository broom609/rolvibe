import { NextRequest, NextResponse } from 'next/server'
import type { App } from '@/types'
import { requireApiAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAppReview, runAppHealthCheck } from '@/lib/app-review'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const admin = createAdminClient()
  const body = await request.json()
  const allowed = ['status', 'is_featured', 'health_status', 'admin_notes', 'rejection_reason']
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))

  if (body.refreshReview) {
    const { data: app } = await admin.from('apps').select('*').eq('id', id).single()
    if (app) {
      const review = computeAppReview(app as App)
      const health = await runAppHealthCheck((app as App).app_url)
      await admin.from('app_reviews').upsert({
        app_id: id,
        ...review,
        checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      Object.assign(update, {
        score: review.overall_score,
        health_status: health.health_status,
        last_health_check: new Date().toISOString(),
        admin_notes: health.admin_notes,
      })
    }
  }

  const { data, error } = await admin
    .from('apps')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ app: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('apps')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
