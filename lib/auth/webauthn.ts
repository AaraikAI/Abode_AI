import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server"
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/typescript-types"

import { supabase } from "@/lib/db/supabase"
import { registerMfaMethod, recordMfaUsage, updateMfaSignCount } from "@/lib/auth/store"

const rpName = process.env.WEBAUTHN_RP_NAME ?? "Abode AI"
const rpID = process.env.WEBAUTHN_RP_ID ?? process.env.NEXT_PUBLIC_DOMAIN ?? "localhost"
const origin = process.env.WEBAUTHN_ORIGIN ?? `https://${rpID}`

const CHALLENGE_TABLE = "webauthn_challenges"

export async function createRegistrationOptions(user: { id: string; email?: string | null; name?: string | null }) {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email ?? user.name ?? user.id,
    attestationType: "indirect",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  })

  await persistChallenge({
    userId: user.id,
    challenge: options.challenge,
    type: "registration",
  })

  return options
}

export async function verifyRegistrationResponsePayload(userId: string, response: RegistrationResponseJSON) {
  const challenge = await consumeChallenge(userId, "registration")
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed")
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

  await registerMfaMethod({
    userId,
    methodType: "webauthn",
    label: "Security Key",
    credentialId: Buffer.from(credentialID).toString("base64url"),
    publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
    signCount: counter,
  })

  return verification
}

export async function createAuthenticationOptions(user: { id: string }) {
  const credentials = await loadCredentials(user.id)
  const options = await generateAuthenticationOptions({
    allowCredentials: credentials.map((credential) => ({
      id: Buffer.from(credential.credential_id!, "base64url"),
      type: "public-key",
    })),
    userVerification: "required",
    rpID,
  })

  await persistChallenge({
    userId: user.id,
    challenge: options.challenge,
    type: "authentication",
  })

  return options
}

export async function verifyAuthenticationResponsePayload(userId: string, response: AuthenticationResponseJSON) {
  const challenge = await consumeChallenge(userId, "authentication")
  const credentials = await loadCredentials(userId)
  const credential = credentials.find((item) => item.credential_id === response.id)
  if (!credential) {
    throw new Error("Unknown credential")
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(credential.credential_id!, "base64url"),
      credentialPublicKey: Buffer.from(credential.public_key!, "base64url"),
      counter: credential.sign_count ?? 0,
    },
  })

  if (!verification.verified) {
    throw new Error("Authentication verification failed")
  }

  if (verification.authenticationInfo) {
    await updateMfaSignCount(credential.id, verification.authenticationInfo.newCounter)
  } else {
    await recordMfaUsage(credential.id)
  }

  return verification
}

async function persistChallenge(params: { userId: string; challenge: string; type: string }) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const { error } = await supabase.from(CHALLENGE_TABLE).insert({
    user_id: params.userId,
    challenge: params.challenge,
    type: params.type,
    expires_at: expiresAt,
  })

  if (error) {
    throw new Error(`Failed to persist WebAuthn challenge: ${error.message}`)
  }
}

async function consumeChallenge(userId: string, type: string) {
  const { data, error } = await supabase
    .from(CHALLENGE_TABLE)
    .select("id, challenge, expires_at")
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`No challenge found for ${type}`)
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new Error("WebAuthn challenge expired")
  }

  await supabase.from(CHALLENGE_TABLE).delete().eq("id", data.id)
  return data.challenge
}

async function loadCredentials(userId: string) {
  const { data, error } = await supabase
    .from("user_mfa_methods")
    .select("id, credential_id, public_key, sign_count")
    .eq("user_id", userId)
    .eq("method_type", "webauthn")

  if (error) {
    throw new Error(`Failed to load credentials: ${error.message}`)
  }

  return data ?? []
}
