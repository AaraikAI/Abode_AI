import { supabase } from "@/lib/db/supabase"

export interface BillingPlan {
  id: string
  slug: string
  name: string
  description?: string | null
  monthlyPriceCents: number
  annualPriceCents?: number | null
  includedCredits: number
  stripePriceId?: string | null
  stripeAnnualPriceId?: string | null
  isActive: boolean
  features: Record<string, unknown>
}

export interface OrganizationSubscription {
  id: string
  orgId: string
  planId?: string | null
  status: string
  trialEndsAt?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  creditsBalance: number
  creditsReserved: number
  autoRenew: boolean
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

export async function listActivePlans(): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, slug, name, description, monthly_price_cents, annual_price_cents, included_credits, stripe_price_id, stripe_annual_price_id, is_active")
    .eq("is_active", true)
    .order("monthly_price_cents", { ascending: true })

  if (error) {
    throw new Error(`Failed to load billing plans: ${error.message}`)
  }

  const features = await loadPlanFeatures()

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    monthlyPriceCents: row.monthly_price_cents ?? 0,
    annualPriceCents: row.annual_price_cents ?? null,
    includedCredits: row.included_credits ?? 0,
    stripePriceId: row.stripe_price_id ?? null,
    stripeAnnualPriceId: row.stripe_annual_price_id ?? null,
    isActive: row.is_active,
    features: features[row.id] ?? {},
  }))
}

async function loadPlanFeatures(): Promise<Record<string, Record<string, unknown>>> {
  const { data, error } = await supabase
    .from("plan_feature_flags")
    .select("plan_id, feature_key, feature_value")

  if (error) {
    throw new Error(`Failed to load plan features: ${error.message}`)
  }

  return (data ?? []).reduce<Record<string, Record<string, unknown>>>((acc, row) => {
    const existing = acc[row.plan_id] ?? {}
    existing[row.feature_key] = row.feature_value
    acc[row.plan_id] = existing
    return acc
  }, {})
}

export async function getOrganizationSubscription(orgId: string): Promise<OrganizationSubscription | null> {
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      "id, org_id, plan_id, status, trial_ends_at, current_period_start, current_period_end, credits_balance, credits_reserved, auto_renew, stripe_customer_id, stripe_subscription_id"
    )
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load subscription: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    orgId: data.org_id,
    planId: data.plan_id ?? null,
    status: data.status,
    trialEndsAt: data.trial_ends_at ?? null,
    currentPeriodStart: data.current_period_start ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
    creditsBalance: data.credits_balance ?? 0,
    creditsReserved: data.credits_reserved ?? 0,
    autoRenew: data.auto_renew,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  }
}

export async function recordCreditTransaction(params: {
  orgId: string
  subscriptionId?: string | null
  delta: number
  reason?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from("credit_transactions").insert({
    org_id: params.orgId,
    subscription_id: params.subscriptionId ?? null,
    delta: params.delta,
    balance: 0,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
  })

  if (error) {
    throw new Error(`Failed to record credit transaction: ${error.message}`)
  }
}

export async function listCreditTransactions(orgId: string, limit = 50) {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, delta, balance, reason, metadata, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to load credit history: ${error.message}`)
  }

  return data ?? []
}
