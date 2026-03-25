import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { sendAppSubmittedEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)))
  const category = searchParams.get('category')

  const admin = createAdminClient()
  let query = admin
    .from('apps')
    .select('*, creator:profiles!apps_creator_id_fkey(username, display_name, avatar_url)')
    .eq('status', 'active')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ apps: data ?? [], hasMore: (data ?? []).length === limit })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name, tagline, description, app_url, category, tags, built_with,
    pricing_type, price_cents, subscription_price_cents, is_nsfw,
    thumbnail_url, screenshots,
  } = body

  // Generate unique slug
  const admin = createAdminClient()
  let slug = slugify(name)
  let suffix = 0
  while (true) {
    const { data: existing } = await admin.from('apps').select('id').eq('slug', slug).single()
    if (!existing) break
    suffix++
    slug = `${slugify(name)}-${suffix}`
  }

  const { data: app, error } = await supabase.from('apps').insert({
    creator_id: user.id,
    name, tagline, description, app_url, category,
    tags: tags || [],
    built_with, pricing_type,
    price_cents: pricing_type === 'paid' ? price_cents : null,
    subscription_price_cents: pricing_type === 'subscription' ? subscription_price_cents : null,
    is_nsfw: is_nsfw || false,
    thumbnail_url, screenshots: screenshots || [],
    slug,
    status: 'pending',
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Upgrade user to creator role if needed
  const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single()
  if (profile?.role === 'user') {
    await admin.from('profiles').update({ role: 'creator' }).eq('id', user.id)
  }

  // Send confirmation email
  try {
    const email = user.email
    if (email) await sendAppSubmittedEmail(email, name)
  } catch { /* non-fatal */ }

  return NextResponse.json({ app })
}
