import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth"
import type { TokenSet } from "openid-client"

export interface OIDCProfile extends Record<string, unknown> {
  sub?: string
  email?: string
  name?: string
}

export type OidcUserConfig<P extends OIDCProfile = OIDCProfile> = OAuthUserConfig<P> & {
  issuer: string
  id?: string
  name?: string
  wellKnown?: string
}

export default function OIDCProvider<P extends OIDCProfile = OIDCProfile>(options: OidcUserConfig<P>): OAuthConfig<P> {
  const { issuer, id, name, wellKnown, clientId, clientSecret, profile, ...rest } = options
  const trimmedIssuer = issuer.replace(/\/+$/, "")

  const profileResolver: OAuthConfig<P>["profile"] =
    profile ||
    ((incomingProfile, tokens) => {
      const tokenSet = tokens as TokenSet & { claims?: () => Record<string, unknown> }
      const claims = typeof tokenSet.claims === "function" ? tokenSet.claims() : {}
      const claimsRecord = claims as Record<string, unknown>
      const profileRecord = incomingProfile as Record<string, unknown>
      const subValue = profileRecord["sub"]
      const emailValue = profileRecord["email"]
      const nameValue = profileRecord["name"]
      const claimSub = claimsRecord["sub"]
      const claimEmail = claimsRecord["email"]
      const claimName = claimsRecord["name"]
      const subject =
        (typeof subValue === "string" && subValue.trim()
          ? subValue.trim()
          : typeof claimSub === "string" && claimSub.trim()
            ? claimSub.trim()
            : null) ??
        (typeof emailValue === "string" && emailValue.trim()
          ? emailValue.trim()
          : typeof claimEmail === "string" && claimEmail.trim()
            ? claimEmail.trim()
            : undefined)

      if (!subject) {
        throw new Error("OIDC profile did not include a subject or email identifier")
      }

      return {
        id: subject,
        email:
          typeof emailValue === "string" && emailValue.trim()
            ? emailValue
            : typeof claimEmail === "string" && claimEmail.trim()
              ? claimEmail
              : null,
        name:
          typeof nameValue === "string" && nameValue.trim()
            ? nameValue
            : typeof claimName === "string" && claimName.trim()
              ? claimName
              : null,
      }
    })

  return {
    id: id ?? "oidc",
    name: name ?? "OIDC",
    type: "oauth",
    issuer: trimmedIssuer,
    wellKnown: wellKnown ?? `${trimmedIssuer}/.well-known/openid-configuration`,
    clientId,
    clientSecret,
    profile: profileResolver,
    ...rest,
  }
}
