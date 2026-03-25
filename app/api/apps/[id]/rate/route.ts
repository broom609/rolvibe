import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('app_ratings')
    .select('rating')
    .eq('app_id', id)

  const ratings = data || []
  const count = ratings.length
  const average = count > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / count : 0

  // Get current user's rating if logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userRating: number | null = null
  if (user) {
    const { data: ur } = await admin
      .from('app_ratings')
      .select('rating')
      .eq('app_id', id)
      .eq('user_id', user.id)
      .single()
    userRating = ur?.rating ?? null
  }

  return NextResponse.json({ average: Math.round(average * 10) / 10, count, userRating })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rating } = await request.json()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('app_ratings').upsert({ user_id: user.id, app_id: id, rating })

  // Recalculate
  const { data } = await admin.from('app_ratings').select('rating').eq('app_id', id)
  const ratings = data || []
  const count = ratings.length
  const average = count > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / count : 0

  return NextResponse.json({ average: Math.round(average * 10) / 10, count, userRating: rating })
}
