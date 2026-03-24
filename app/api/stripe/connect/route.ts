import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Implement Stripe Connect Express onboarding
  // 1. Create Stripe Connect account
  // 2. Generate onboarding link
  // 3. Redirect to onboarding URL
  return NextResponse.json({ message: 'Stripe Connect coming soon' }, { status: 501 })
}
