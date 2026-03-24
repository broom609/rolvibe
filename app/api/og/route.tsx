import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  let name = 'Rolvibe'
  let tagline = 'Where vibe coders get discovered.'
  let tryCount = 0
  let creator = ''

  if (slug) {
    try {
      const admin = createAdminClient()
      const { data: app } = await admin
        .from('apps')
        .select('name, tagline, try_count, creator:profiles(username)')
        .eq('slug', slug)
        .single()

      if (app) {
        name = app.name
        tagline = app.tagline
        tryCount = app.try_count || 0
        const creatorData = app.creator as unknown as { username: string } | null
        creator = creatorData?.username || ''
      }
    } catch { /* use defaults */ }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0E0E10 0%, #1A1A1E 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF2D9B, #6B21E8, #00B4FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '24px', fontWeight: 900,
          }}>R</div>
          <span style={{ color: '#A1A1AA', fontSize: '20px', fontWeight: 600 }}>Rolvibe</span>
        </div>

        <h1 style={{
          fontSize: slug ? '60px' : '72px',
          fontWeight: 700,
          color: '#F4F4F5',
          margin: 0,
          lineHeight: 1.1,
          marginBottom: '20px',
          maxWidth: '900px',
        }}>
          {name}
        </h1>

        <p style={{
          fontSize: '28px',
          color: '#A1A1AA',
          margin: 0,
          marginBottom: '40px',
          maxWidth: '800px',
        }}>
          {tagline}
        </p>

        {slug && (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {creator && (
              <span style={{ color: '#71717A', fontSize: '18px' }}>@{creator}</span>
            )}
            {tryCount > 0 && (
              <span style={{
                background: 'rgba(255,45,155,0.15)',
                border: '1px solid rgba(255,45,155,0.3)',
                color: '#FF2D9B',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                {tryCount.toLocaleString()} tries
              </span>
            )}
          </div>
        )}

        {/* Bottom gradient bar */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #FF2D9B, #6B21E8, #00B4FF)',
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
