import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Insert try event
  await admin.from('app_tries').insert({
    app_id: id,
    user_id: user?.id || null,
    referrer: request.headers.get('referer') || null,
    user_agent: request.headers.get('user-agent') || null,
  })

  // Increment try count
  const { data: appData } = await admin.from('apps').select('try_count').eq('id', id).single()
  if (appData) {
    await admin.from('apps').update({ try_count: (appData.try_count || 0) + 1 }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Update latest try with session_seconds
  await admin
    .from('app_tries')
    .update({ session_seconds: body.session_seconds })
    .eq('app_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json({ success: true })
}
