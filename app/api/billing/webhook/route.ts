import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { recordCreditTransaction } from "@/lib/data/billing"

export const runtime = "edge"

const stripeApiKey = process.env.STRIPE_API_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null

export async function POST(request: NextRequest) {
  const body = await request.arrayBuffer()
  const payload = Buffer.from(body)
  let event: Stripe.Event

  if (stripe && webhookSecret) {
    const signature = request.headers.get("stripe-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
    }
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (error) {
      return NextResponse.json({ error: `Webhook verification failed: ${(error as Error).message}` }, { status: 400 })
    }
  } else {
    event = JSON.parse(Buffer.from(payload).toString())
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice
    const orgId = invoice.metadata?.orgId ?? undefined
    if (orgId) {
      await recordCreditTransaction({
        orgId,
        delta: invoice.amount_paid ?? 0,
        metadata: { stripeInvoiceId: invoice.id, type: "payment" },
      })
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    const orgId = invoice.metadata?.orgId ?? undefined
    if (orgId) {
      await recordCreditTransaction({
        orgId,
        delta: 0,
        metadata: { stripeInvoiceId: invoice.id, type: "payment_failed" },
      })
    }
  }

  return NextResponse.json({ received: true })
}
