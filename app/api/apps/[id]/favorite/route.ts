import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('app_id')
    .eq('user_id', user.id)
    .eq('app_id', id)
    .single()

  if (existing) {
    // Unfavorite
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('app_id', id)
    const { data: app } = await admin.from('apps').select('favorite_count').eq('id', id).single()
    if (app) {
      await admin.from('apps').update({ favorite_count: Math.max(0, (app.favorite_count || 0) - 1) }).eq('id', id)
    }
    return NextResponse.json({ favorited: false })
  } else {
    // Favorite
    await supabase.from('favorites').insert({ user_id: user.id, app_id: id })
    const { data: app } = await admin.from('apps').select('favorite_count').eq('id', id).single()
    if (app) {
      await admin.from('apps').update({ favorite_count: (app.favorite_count || 0) + 1 }).eq('id', id)
    }
    return NextResponse.json({ favorited: true })
  }
}
