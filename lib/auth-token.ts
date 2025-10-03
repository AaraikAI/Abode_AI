import { config, isServer } from "./config"

export function getAccessToken(): string | undefined {
  if (isServer) return undefined
  try {
    return window.localStorage.getItem(config.authTokenKey) ?? undefined
  } catch (error) {
    console.warn("Unable to read access token", error)
    return undefined
  }
}

export function setAccessToken(token: string) {
  if (isServer) return
  try {
    window.localStorage.setItem(config.authTokenKey, token)
  } catch (error) {
    console.warn("Unable to persist access token", error)
  }
}

export function clearAccessToken() {
  if (isServer) return
  try {
    window.localStorage.removeItem(config.authTokenKey)
  } catch (error) {
    console.warn("Unable to clear access token", error)
  }
}
