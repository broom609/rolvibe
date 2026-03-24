import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAppRejectedEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { app_id, reason } = await request.json()
  const admin = createAdminClient()

  const { data: app, error } = await admin
    .from('apps')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', app_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(app.creator_id)
    if (authUser.user?.email) {
      await sendAppRejectedEmail(authUser.user.email, app.name, reason)
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true })
}
