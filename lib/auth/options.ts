import { randomUUID } from "crypto"

import type { NextAuthOptions } from "next-auth"
import Auth0Provider from "next-auth/providers/auth0"
import CredentialsProvider from "next-auth/providers/credentials"

import OIDCProvider from "@/lib/auth/providers/oidc"

import { recordAuthEvent } from "@/lib/auth/audit"
import {
  endUserSession,
  ensureMembership,
  ensureOrganization,
  ensureUser,
  getMembership,
  getUserByAuthProvider,
  recordUserSession,
  touchUserSession,
} from "@/lib/auth/store"
import { collectUserPermissions, DEFAULT_ROLE } from "@/lib/rbac"
import { getAuthRequestContext, setAuthRequestMetadata } from "@/lib/auth/request-context"

const MEMBERSHIP_REFRESH_INTERVAL_MS = 2 * 60 * 1000

const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL
const auth0ClientId = process.env.AUTH0_CLIENT_ID
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET

const oidcIssuer = process.env.OIDC_ISSUER
const oidcClientId = process.env.OIDC_CLIENT_ID
const oidcClientSecret = process.env.OIDC_CLIENT_SECRET

const devAuthEnabled = process.env.DEV_AUTH_ENABLED === "true"
const devUserRoles = process.env.DEV_AUTH_ROLES?.split(",").map((role) => role.trim()).filter(Boolean)
const devUserOrgId = process.env.DEV_AUTH_ORG_ID ?? "demo-org"

const auth0Provider =
  auth0Domain && auth0ClientId && auth0ClientSecret
    ? Auth0Provider({
        clientId: auth0ClientId,
        clientSecret: auth0ClientSecret,
        issuer: auth0Domain,
      })
    : null

type AuthProfile = Record<string, unknown> | undefined

function resolveRoles({ profile, user }: { profile: AuthProfile; user?: unknown }, roleClaim: string): string[] {
  const collected = new Set<string>()

  if (profile) {
    const claimedRoles = (profile as Record<string, unknown>)[roleClaim]
    if (Array.isArray(claimedRoles)) {
      for (const role of claimedRoles) {
        if (typeof role === "string" && role.trim()) {
          collected.add(role.trim())
        }
      }
    } else if (typeof claimedRoles === "string" && claimedRoles.trim()) {
      collected.add(claimedRoles.trim())
    }
  }

  const typedUser = user as Partial<{ roles: string[] }> | undefined
  typedUser?.roles?.forEach((role) => {
    if (role) collected.add(role)
  })

  return [...collected]
}

function resolveOrgExternalId({ profile, user }: { profile: AuthProfile; user?: unknown }, orgClaim: string) {
  const typedUser = user as Partial<{ orgId?: string }> | undefined
  const fromProfile = profile ? (profile as Record<string, unknown>)[orgClaim] : undefined
  if (typeof fromProfile === "string" && fromProfile.trim()) {
    return fromProfile.trim()
  }
  if (typedUser?.orgId) {
    return typedUser.orgId
  }
  return undefined
}

function ensureRolesPresence(roles: string[] | undefined) {
  if (!roles || roles.length === 0) {
    return [DEFAULT_ROLE]
  }
  return roles
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(auth0Provider ? [auth0Provider] : []),
    ...(oidcIssuer && oidcClientId && oidcClientSecret
      ? [
          OIDCProvider({
            id: "enterprise-oidc",
            name: "Enterprise SSO",
            clientId: oidcClientId,
            clientSecret: oidcClientSecret,
            issuer: oidcIssuer,
          }),
        ]
      : []),
    ...(devAuthEnabled
      ? [
          CredentialsProvider({
            name: "Developer Login",
            credentials: {
              email: { label: "Email", type: "email" },
              name: { label: "Name", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email) {
                throw new Error("Email is required")
              }

              return {
                id: credentials.email,
                email: credentials.email,
                name: credentials.name || "Abode Developer",
                roles: devUserRoles?.length ? devUserRoles : [DEFAULT_ROLE],
                orgId: devUserOrgId,
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (!token.sessionId) {
        token.sessionId = randomUUID()
      }

      const roleClaim = process.env.AUTH0_ROLE_CLAIM ?? "https://abode.ai/roles"
      const orgClaim = process.env.AUTH0_ORG_CLAIM ?? "https://abode.ai/orgId"

      if (account) {
        try {
          const providerAccountId =
            account.provider === "credentials"
              ? `credentials:${(user as { id?: string; email?: string } | undefined)?.id ?? token.email ?? token.sub ?? randomUUID()}`
              : account.providerAccountId ?? (token.sub as string | undefined) ?? randomUUID()

          const resolvedRoles = resolveRoles({ profile: profile as AuthProfile, user }, roleClaim)
          const orgExternalId =
            resolveOrgExternalId({ profile: profile as AuthProfile, user }, orgClaim) ?? devUserOrgId
          let resolvedOrgExternalId = orgExternalId

          const supabaseUser = await ensureUser({
            auth0UserId: providerAccountId,
            email: (profile as Record<string, string | undefined> | undefined)?.email ?? user?.email ?? token.email,
            displayName: (profile as Record<string, string | undefined> | undefined)?.name ?? user?.name ?? token.name,
          })

          let membershipOrgId: string | undefined
          let finalRoles: string[] = ensureRolesPresence(resolvedRoles)

          if (orgExternalId) {
            const organization = await ensureOrganization(orgExternalId, (profile as Record<string, string | undefined> | undefined)?.organization)
            membershipOrgId = organization.id
            resolvedOrgExternalId = organization.external_ref ?? orgExternalId
            setAuthRequestMetadata({ orgExternalId: resolvedOrgExternalId })

            const membership = await ensureMembership({
              userId: supabaseUser.id,
              organizationId: organization.id,
              roles: finalRoles,
              actorUserId: supabaseUser.id,
            })
            membershipOrgId = membership.organization_id
            finalRoles = ensureRolesPresence(membership.roles)
          }

          token.userId = supabaseUser.id
          token.orgId = membershipOrgId
          token.orgExternalId = resolvedOrgExternalId
          token.roles = finalRoles
          token.membershipSyncedAt = Date.now()

          const context = getAuthRequestContext()

          setAuthRequestMetadata({
            sessionId: token.sessionId as string,
            userId: supabaseUser.id,
            organizationId: membershipOrgId,
            roles: finalRoles,
            geoCountry: context?.geoCountry,
            deviceId: context?.metadata?.deviceId,
          })
        } catch (error) {
          console.error("Failed to synchronise Auth0 state with Supabase", error)
          token.roles = ensureRolesPresence(token.roles as string[] | undefined)
        }
      } else if (token.userId && token.orgId) {
        const lastSynced = typeof token.membershipSyncedAt === "number" ? token.membershipSyncedAt : 0
        if (Date.now() - lastSynced > MEMBERSHIP_REFRESH_INTERVAL_MS) {
          try {
            const membership = await getMembership(token.userId as string, token.orgId as string)
            if (membership?.roles?.length) {
              token.roles = membership.roles
            }
            token.membershipSyncedAt = Date.now()
          } catch (error) {
            console.error("Failed to refresh membership roles", error)
          }
        }
      }

      token.roles = ensureRolesPresence(token.roles as string[] | undefined)
      return token
    },
    async session({ session, token }) {
      const roles = ensureRolesPresence(token.roles as string[] | undefined)
      const permissions = [...collectUserPermissions(roles)]
      const orgId = (token.orgId as string | undefined) ?? (session.user?.orgId as string | undefined)

      session.user = {
        ...session.user,
        id: (token.userId as string | undefined) ?? session.user?.id,
        email: (token.email as string | undefined) ?? session.user?.email ?? null,
        name: (token.name as string | undefined) ?? session.user?.name ?? null,
        roles,
        orgId,
        orgExternalId: (token.orgExternalId as string | undefined) ?? session.user?.orgExternalId,
        permissions,
        geoPolicyEnforced: session.user?.geoPolicyEnforced ?? false,
        orgGeoPolicy: session.user?.orgGeoPolicy,
      }

      ;(session as unknown as Record<string, unknown>).sessionId = token.sessionId
      return session
    },
  },
  events: {
    async signIn(message) {
      try {
        const context = getAuthRequestContext()
        const providerAccountId = message.account?.providerAccountId
        const metadata = context?.metadata

        let userId = metadata?.userId
        if (!userId && providerAccountId) {
          const supabaseUser = await getUserByAuthProvider(providerAccountId)
          userId = supabaseUser?.id
        }

        if (!userId) {
          return
        }

        const sessionId = metadata?.sessionId ?? randomUUID()
        if (!metadata?.sessionId) {
          setAuthRequestMetadata({ sessionId })
        }

        await recordUserSession({
          sessionId,
          userId,
          organizationId: metadata?.organizationId ?? null,
          ipAddress: context?.ipAddress ?? null,
          geoCountry: context?.geoCountry ?? null,
          userAgent: context?.userAgent ?? null,
          deviceId: metadata?.deviceId ?? context?.metadata?.deviceId ?? null,
          metadata: {
            provider: message.account?.provider,
            isNewUser: message.isNewUser ?? false,
            roles: metadata?.roles,
          },
        })

        await recordAuthEvent({
          userId,
          orgId: metadata?.organizationId ?? null,
          eventType: "login.success",
          ipAddress: context?.ipAddress ?? null,
          geoCountry: context?.geoCountry ?? null,
          userAgent: context?.userAgent ?? null,
          metadata: {
            provider: message.account?.provider,
            isNewUser: message.isNewUser ?? false,
          },
        })
      } catch (error) {
        console.error("Failed to record sign-in audit", error)
      }
    },
    async signOut({ token }) {
      try {
        const sessionId = (token.sessionId as string | undefined) ?? undefined
        const userId = (token.userId as string | undefined) ?? undefined
        const orgId = (token.orgId as string | undefined) ?? undefined

        if (sessionId) {
          await endUserSession(sessionId)
        }

        if (userId) {
          await recordAuthEvent({
            userId,
            orgId,
            eventType: "logout",
          })
        }
      } catch (error) {
        console.error("Failed to record sign-out audit", error)
      }
    },
    async session({ token }) {
      try {
        const sessionId = token.sessionId as string | undefined
        if (sessionId) {
          await touchUserSession(sessionId)
        }
      } catch (error) {
        console.error("Failed to record session heartbeat", error)
      }
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
}
