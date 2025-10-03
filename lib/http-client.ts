import { config } from "./config"
import { getAccessToken } from "./auth-token"

interface FetchJsonOptions {
  baseUrl?: string
  auth?: boolean
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
  options: FetchJsonOptions = {}
): Promise<T> {
  const baseUrl = options.baseUrl ?? config.platformApiBaseUrl
  if (!baseUrl) {
    throw new Error(`Missing API base URL for request to ${path}`)
  }

  const headers = new Headers(init?.headers ?? {})
  headers.set("Accept", "application/json")
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth) {
    const token = getAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json() as Promise<T>
}
