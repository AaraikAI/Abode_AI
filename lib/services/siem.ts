import { env } from "process"

interface SplunkPayload {
  action: string
  actor: string
  orgId: string
  resource?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export async function forwardToSiem(payload: SplunkPayload) {
  const endpoint = env.SPLUNK_HEC_ENDPOINT
  const token = env.SPLUNK_HEC_TOKEN

  if (!endpoint || !token) {
    if (env.NODE_ENV !== "test") {
      console.info("[SIEM] Splunk forwarding skipped (missing SPLUNK_HEC_ENDPOINT)", payload)
    }
    return
  }

  try {
    await postWithRetry(endpoint, token, payload)
  } catch (error) {
    console.warn("[SIEM] Failed to forward event", error)
  }
}

async function postWithRetry(endpoint: string, token: string, payload: SplunkPayload, attempt = 1): Promise<Response> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Splunk ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event: payload }),
  })

  if (!response.ok && attempt < 3) {
    const delay = Math.min(2000 * attempt, 5000)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return postWithRetry(endpoint, token, payload, attempt + 1)
  }

  if (!response.ok) {
    console.warn("[SIEM] Final attempt failed", await response.text())
  }

  return response
}
