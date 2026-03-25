import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: topLevel, error } = await admin
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('app_id', id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch replies for all top-level comments
  const commentIds = (topLevel || []).map(c => c.id)
  let replies: typeof topLevel = []
  if (commentIds.length > 0) {
    const { data: r } = await admin
      .from('comments')
      .select('*, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true })
    replies = r || []
  }

  const comments = (topLevel || []).map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_id === c.id),
  }))

  return NextResponse.json({ comments })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body, parent_id } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: comment, error } = await admin
    .from('comments')
    .insert({
      app_id: id,
      user_id: user.id,
      parent_id: parent_id || null,
      body: body.trim(),
    })
    .select('*, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ comment })
}
