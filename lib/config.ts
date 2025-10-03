export const config = {
  platformApiBaseUrl: process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ?? "",
  metricsApiBaseUrl: process.env.NEXT_PUBLIC_METRICS_API_BASE_URL ?? "",
  billingApiBaseUrl: process.env.NEXT_PUBLIC_BILLING_API_BASE_URL ?? "",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? "",
  authTokenKey: process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "abodeai_access_token",
  stripePortalUrl: process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL ?? "",
}

export const isServer = typeof window === "undefined"
