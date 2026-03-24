import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const pricing = searchParams.get('pricing') || ''
  const sort = searchParams.get('sort') || 'relevance'

  if (!q.trim()) {
    return NextResponse.json({ apps: [] })
  }

  const admin = createAdminClient()

  let query = admin
    .from('apps')
    .select('*, creator:profiles(id, username, display_name, avatar_url, is_verified)')
    .eq('status', 'active')
    .or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(20)

  if (category) query = query.eq('category', category)
  if (pricing) query = query.eq('pricing_type', pricing)

  switch (sort) {
    case 'newest':
      query = query.order('published_at', { ascending: false })
      break
    case 'most_tried':
      query = query.order('try_count', { ascending: false })
      break
    case 'trending':
      query = query.order('score', { ascending: false })
      break
    default:
      query = query.order('score', { ascending: false })
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ apps: data || [] })
}
