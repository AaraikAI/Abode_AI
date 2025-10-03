import { AsyncLocalStorage } from "async_hooks"
import { NextRequest } from "next/server"

export interface AuthRequestMetadata {
  sessionId?: string
  userId?: string
  organizationId?: string
  orgExternalId?: string
  roles?: string[]
  geoCountry?: string
  deviceId?: string
}

export interface AuthRequestContext {
  request: NextRequest
  ipAddress?: string
  userAgent?: string
  geoCountry?: string
  metadata: AuthRequestMetadata
}

const authContextStorage = new AsyncLocalStorage<AuthRequestContext>()

export function runWithAuthRequestContext<T>(
  context: Omit<AuthRequestContext, "metadata"> & { metadata?: AuthRequestMetadata },
  callback: () => T
): T {
  const ctx: AuthRequestContext = {
    ...context,
    metadata: context.metadata ?? {},
  }
  return authContextStorage.run(ctx, callback)
}

export function getAuthRequestContext(): AuthRequestContext | undefined {
  return authContextStorage.getStore()
}

export function setAuthRequestMetadata(partial: AuthRequestMetadata) {
  const context = authContextStorage.getStore()
  if (!context) return
  context.metadata = {
    ...context.metadata,
    ...partial,
  }
}
