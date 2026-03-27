import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAppReview } from '@/lib/app-review'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('apps')
    .select('*, creator:profiles(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ app: data })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const review = computeAppReview({
    name: body.name,
    tagline: body.tagline,
    description: body.description,
    app_url: body.app_url,
    category: body.category,
    tags: body.tags,
    built_with: body.built_with,
    pricing_type: body.pricing_type,
    thumbnail_url: body.thumbnail_url,
    screenshots: body.screenshots,
  })

  const { data, error } = await supabase
    .from('apps')
    .update({
      ...body,
      score: review.overall_score,
      updated_at: new Date().toISOString(),
      status: body.status || 'pending',
    })
    .eq('id', id)
    .eq('creator_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('app_reviews').upsert({
    app_id: id,
    ...review,
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ app: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('apps')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('creator_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
