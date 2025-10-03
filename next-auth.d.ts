import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    sessionId?: string
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      roles: string[]
      orgId?: string
      orgExternalId?: string
      permissions: string[]
      geoPolicyEnforced?: boolean
      orgGeoPolicy?: {
        allowed: string[]
        blocked: string[]
        enforced: boolean
      }
    }
  }

  interface User {
    id?: string
    roles?: string[]
    orgId?: string
    orgExternalId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[]
    orgId?: string
    orgExternalId?: string
    userId?: string
    sessionId?: string
    membershipSyncedAt?: number
  }
}
