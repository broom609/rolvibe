import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  const nextStatus = body.status === 'dismissed' ? 'dismissed' : 'resolved'
  const { error } = await admin
    .from('reports')
    .update({ status: nextStatus })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (body.hideApp && body.appId) {
    await admin
      .from('apps')
      .update({ status: 'hidden', updated_at: new Date().toISOString() })
      .eq('id', body.appId)
  }

  return NextResponse.json({ success: true, status: nextStatus })
}
