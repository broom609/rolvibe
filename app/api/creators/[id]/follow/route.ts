import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ count }, auth] = await Promise.all([
    admin.from('follows').select('*', { count: 'exact', head: true }).eq('creator_id', id),
    requireApiUser(),
  ])

  let isFollowing = false
  if (auth.ok) {
    const { data } = await admin
      .from('follows')
      .select('creator_id')
      .eq('creator_id', id)
      .eq('follower_id', auth.user.id)
      .maybeSingle()

    isFollowing = Boolean(data)
  }

  return NextResponse.json({
    followerCount: count || 0,
    isFollowing,
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  if (auth.user.id === id) {
    return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('follows')
    .upsert({
      follower_id: auth.user.id,
      creator_id: id,
    }, { onConflict: 'follower_id,creator_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { count } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', id)

  return NextResponse.json({ success: true, followerCount: count || 0, isFollowing: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { error } = await admin
    .from('follows')
    .delete()
    .eq('follower_id', auth.user.id)
    .eq('creator_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { count } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', id)

  return NextResponse.json({ success: true, followerCount: count || 0, isFollowing: false })
}
