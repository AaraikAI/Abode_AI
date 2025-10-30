import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listActivePlans } from "@/lib/data/billing"

const stripeApiKey = process.env.STRIPE_API_KEY
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const body = (await request.json().catch(() => ({}))) as {
    planSlug?: string
    successUrl?: string
    cancelUrl?: string
  }

  const plans = await listActivePlans()
  const plan = plans.find((item) => item.slug === body.planSlug) ?? plans[0]

  if (!plan) {
    return NextResponse.json({ error: "No billing plans configured" }, { status: 400 })
  }

  const successUrl = body.successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/success`
  const cancelUrl = body.cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/cancel`

  if (!stripe || !plan.stripePriceId) {
    const mockSession = {
      id: `sess_mock_${Date.now()}`,
      url: `${successUrl}?session=mock&plan=${plan.slug}`,
      priceId: plan.stripePriceId ?? "price_mock",
      orgId,
      planSlug: plan.slug,
    }
    return NextResponse.json({ session: mockSession }, { status: 201 })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: orgId,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ session: checkoutSession }, { status: 201 })
}
