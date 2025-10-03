import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/auth/session"
import { listCreditPacks, recordCreditPurchase, updateCreditTransactionStatus } from "@/lib/data/credits"

function createMockStripeSession(amountCents: number) {
  return {
    id: `pi_${randomUUID().slice(0, 10)}`,
    clientSecret: `cs_${randomUUID().slice(0, 18)}`,
    amount: amountCents,
    currency: "usd",
    status: "requires_payment_method",
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession({ request, enforceDevice: true, enforceGeo: true })
  const orgId = session.user?.orgId ?? "demo-org"

  const body = (await request.json().catch(() => ({}))) as { packId?: string }
  if (!body.packId) {
    return NextResponse.json({ error: "packId is required" }, { status: 400 })
  }

  const packs = await listCreditPacks()
  const pack = packs.find((candidate) => candidate.id === body.packId)
  if (!pack) {
    return NextResponse.json({ error: "Credit pack not found" }, { status: 404 })
  }

  const stripeSession = createMockStripeSession(pack.priceCents)
  const transaction = await recordCreditPurchase({
    orgId,
    packId: pack.id,
    amountCents: pack.priceCents,
    credits: pack.credits,
    status: "pending",
    stripePaymentIntent: stripeSession.id,
  })

  // Simulate immediate success for demo purposes.
  await updateCreditTransactionStatus(transaction.id, "succeeded")

  return NextResponse.json({
    transaction: { ...transaction, status: "succeeded" },
    stripeSession,
  })
}
