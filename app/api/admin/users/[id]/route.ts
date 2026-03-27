import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_EMAIL, requireApiAdmin } from '@/lib/admin'
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

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.is_verified === 'boolean') update.is_verified = body.is_verified
  if (typeof body.is_banned === 'boolean') update.is_banned = body.is_banned
  if (body.role === 'user' || body.role === 'creator' || body.role === 'admin') {
    update.role = body.role
  }

  const { data, error } = await admin
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (typeof body.is_banned === 'boolean') {
    await admin
      .from('apps')
      .update({
        status: body.is_banned ? 'hidden' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('creator_id', id)
      .neq('status', 'archived')
  }

  return NextResponse.json({ profile: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const admin = createAdminClient()

  const { data: targetAuthUser } = await admin.auth.admin.getUserById(id)
  if ((targetAuthUser.user?.email || '').toLowerCase() === ADMIN_EMAIL) {
    return NextResponse.json({ error: 'The primary admin account cannot be deleted' }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
