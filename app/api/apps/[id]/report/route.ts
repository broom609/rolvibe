import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { reason, details } = body

  // Check for duplicate report
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('app_id', id)
    .eq('reporter_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already reported' }, { status: 409 })
  }

  const { error } = await supabase.from('reports').insert({
    app_id: id,
    reporter_id: user.id,
    reason,
    details: details || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
