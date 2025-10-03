import { ensurePlatformToken } from "@/lib/auth-session"
import { config } from "@/lib/config"
import { fetchJson } from "@/lib/http-client"
import type {
  BillingSummary,
  PlatformSnapshot,
  SustainabilitySummary,
} from "@/lib/platform-types"

export async function fetchPlatformSnapshot() {
  await ensurePlatformToken()
  return fetchJson<PlatformSnapshot>("platform/snapshot", undefined, {
    baseUrl: config.platformApiBaseUrl,
    auth: true,
  })
}

export async function fetchSustainabilitySummary() {
  await ensurePlatformToken()
  return fetchJson<SustainabilitySummary>("metrics/sustainability", undefined, {
    baseUrl: config.metricsApiBaseUrl || config.platformApiBaseUrl,
    auth: true,
  })
}

export async function fetchBillingSummary() {
  await ensurePlatformToken()
  return fetchJson<BillingSummary>("billing/summary", undefined, {
    baseUrl: config.billingApiBaseUrl || config.platformApiBaseUrl,
    auth: true,
  })
}
