import { config } from "@/lib/config"
import { getAccessToken, setAccessToken } from "@/lib/auth-token"

let inflightPromise: Promise<string | undefined> | null = null

async function requestNewToken() {
  const baseUrl = config.platformApiBaseUrl
  if (!baseUrl) {
    throw new Error("Platform API base URL is not configured")
  }

  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID
  const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET
  const orgId = process.env.NEXT_PUBLIC_ORG_ID

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/token`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(clientId ? { "x-client-id": clientId } : {}),
      ...(clientSecret ? { "x-client-secret": clientSecret } : {}),
      ...(orgId ? { "x-org-id": orgId } : {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Auth token request failed: ${response.status} ${errorText}`)
  }

  const body = (await response.json()) as { access_token?: string }
  if (!body.access_token) {
    throw new Error("Auth token response missing access_token field")
  }
  setAccessToken(body.access_token)
  return body.access_token
}

export async function ensurePlatformToken() {
  const existing = getAccessToken()
  if (existing) {
    return existing
  }

  if (!inflightPromise) {
    inflightPromise = requestNewToken().finally(() => {
      inflightPromise = null
    })
  }

  return inflightPromise
}
