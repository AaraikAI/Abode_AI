import { randomUUID } from "crypto"

import { supabase } from "@/lib/db/supabase"

export interface CreditPack {
  id: string
  name: string
  description: string
  credits: number
  priceCents: number
  featured: boolean
  createdAt: string
}

export interface CreditTransaction {
  id: string
  orgId: string
  packId: string
  credits: number
  amountCents: number
  status: string
  stripePaymentIntent?: string | null
  createdAt: string
}

const PACK_TABLE = "credit_packs"
const TRANSACTION_TABLE = "credit_transactions"

export async function listCreditPacks(): Promise<CreditPack[]> {
  const { data, error } = await supabase
    .from(PACK_TABLE)
    .select("id, name, description, credits, price_cents, featured, created_at")
    .order("featured", { ascending: false })
    .order("price_cents", { ascending: true })

  if (error) {
    throw new Error(`Failed to list credit packs: ${error.message}`)
  }

  return (data ?? []).map((pack) => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    credits: pack.credits,
    priceCents: pack.price_cents,
    featured: !!pack.featured,
    createdAt: pack.created_at,
  }))
}

export async function createCreditPack(params: {
  name: string
  description: string
  credits: number
  priceCents: number
  featured?: boolean
}): Promise<CreditPack> {
  const { data, error } = await supabase
    .from(PACK_TABLE)
    .insert({
      id: randomUUID(),
      name: params.name,
      description: params.description,
      credits: params.credits,
      price_cents: params.priceCents,
      featured: params.featured ?? false,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create credit pack: ${error?.message ?? "unknown error"}`)
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    credits: data.credits,
    priceCents: data.price_cents,
    featured: !!data.featured,
    createdAt: data.created_at,
  }
}

export async function recordCreditPurchase(params: {
  orgId: string
  packId: string
  amountCents: number
  credits: number
  status?: string
  stripePaymentIntent?: string | null
}): Promise<CreditTransaction> {
  const { data, error } = await supabase
    .from(TRANSACTION_TABLE)
    .insert({
      org_id: params.orgId,
      pack_id: params.packId,
      amount_cents: params.amountCents,
      credits: params.credits,
      status: params.status ?? "pending",
      stripe_payment_intent: params.stripePaymentIntent ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to record credit transaction: ${error?.message ?? "unknown error"}`)
  }

  return {
    id: data.id,
    orgId: data.org_id,
    packId: data.pack_id,
    amountCents: data.amount_cents,
    credits: data.credits,
    status: data.status,
    stripePaymentIntent: data.stripe_payment_intent ?? undefined,
    createdAt: data.created_at,
  }
}

export async function updateCreditTransactionStatus(transactionId: string, status: string) {
  const { error } = await supabase
    .from(TRANSACTION_TABLE)
    .update({ status })
    .eq("id", transactionId)

  if (error) {
    throw new Error(`Failed to update transaction status: ${error.message}`)
  }
}

export async function listCreditTransactions(orgId: string, limit = 20): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from(TRANSACTION_TABLE)
    .select("id, org_id, pack_id, credits, amount_cents, status, stripe_payment_intent, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list credit transactions: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    orgId: row.org_id,
    packId: row.pack_id,
    credits: row.credits,
    amountCents: row.amount_cents,
    status: row.status,
    stripePaymentIntent: row.stripe_payment_intent ?? undefined,
    createdAt: row.created_at,
  }))
}
