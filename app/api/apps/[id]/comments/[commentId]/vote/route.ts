import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vote } = await request.json()
  if (vote !== 1 && vote !== -1) return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })

  const admin = createAdminClient()

  // Check existing vote
  const { data: existing } = await admin
    .from('comment_votes')
    .select('vote')
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .single()

  let newVote: number | null = vote

  if (existing?.vote === vote) {
    // Toggle off — remove vote
    await admin.from('comment_votes').delete().eq('user_id', user.id).eq('comment_id', commentId)
    newVote = null
  } else {
    // Upsert vote
    await admin.from('comment_votes').upsert({ user_id: user.id, comment_id: commentId, vote })
  }

  // Recalculate counts
  const { data: votes } = await admin
    .from('comment_votes')
    .select('vote')
    .eq('comment_id', commentId)

  const upvotes = (votes || []).filter(v => v.vote === 1).length
  const downvotes = (votes || []).filter(v => v.vote === -1).length

  await admin.from('comments').update({ upvotes, downvotes }).eq('id', commentId)

  return NextResponse.json({ upvotes, downvotes, userVote: newVote })
}
