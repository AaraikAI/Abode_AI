import { NextResponse } from "next/server"

import { listCreditTransactions } from "@/lib/data/billing"

export async function GET(_: Request, { params }: { params: { orgId: string } }) {
  const transactions = await listCreditTransactions(params.orgId, 50)
  return NextResponse.json({ transactions })
}
