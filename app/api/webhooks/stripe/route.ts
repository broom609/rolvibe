import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: Verify Stripe webhook signature
  // const sig = request.headers.get('stripe-signature')
  // const body = await request.text()
  // const event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!)

  // switch (event.type) {
  //   case 'checkout.session.completed': handle purchase
  //   case 'customer.subscription.created': handle subscription
  //   case 'customer.subscription.deleted': handle cancellation
  // }

  return NextResponse.json({ received: true })
}
