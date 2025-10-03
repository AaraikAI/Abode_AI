import { config as loadEnv } from "dotenv"
import { randomUUID } from "crypto"

import { createClient } from "@supabase/supabase-js"

loadEnv({ path: ".env.local", override: false })
loadEnv({ path: ".env", override: false })

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are not configured")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function ensureOrganization(externalId: string, name: string) {
  const { data: existing, error: selectError } = await supabase
    .from("organizations")
    .select()
    .eq("external_ref", externalId)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to load organization: ${selectError.message}`)
  }

  if (existing) {
    if (existing.name !== name) {
      const { data: updated, error: updateError } = await supabase
        .from("organizations")
        .update({ name })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(`Failed to update organization: ${updateError?.message ?? "no data"}`)
      }

      return updated
    }

    return existing
  }

  const { data: inserted, error: insertError } = await supabase
    .from("organizations")
    .insert({ external_ref: externalId, name })
    .select()
    .single()

  if (insertError || !inserted) {
    throw new Error(`Failed to insert organization: ${insertError?.message ?? "no data"}`)
  }

  return inserted
}

async function ensureUser(params: { auth0UserId: string; email: string; displayName: string }) {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select()
    .eq("auth0_user_id", params.auth0UserId)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to load user: ${selectError.message}`)
  }

  if (existing) {
    const needsUpdate =
      existing.email !== params.email || existing.display_name !== params.displayName

    if (needsUpdate) {
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({ email: params.email, display_name: params.displayName })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(`Failed to update user: ${updateError?.message ?? "no data"}`)
      }

      return updated
    }

    return existing
  }

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({
      auth0_user_id: params.auth0UserId,
      email: params.email,
      display_name: params.displayName,
    })
    .select()
    .single()

  if (insertError || !inserted) {
    throw new Error(`Failed to insert user: ${insertError?.message ?? "no data returned"}`)
  }

  return inserted
}

async function ensureMembership(userId: string, organizationId: string, roles: string[]) {
  const { data: existing, error: selectError } = await supabase
    .from("user_organization_memberships")
    .select()
    .match({ user_id: userId, organization_id: organizationId })
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to load membership: ${selectError.message}`)
  }

  if (existing) {
    const existingSignature = Array.isArray(existing.roles) ? [...existing.roles].sort().join(",") : ""
    const desiredSignature = [...roles].sort().join(",")
    const needsUpdate = existingSignature !== desiredSignature
    if (!needsUpdate) return

    const { error: updateError } = await supabase
      .from("user_organization_memberships")
      .update({ roles })
      .match({ user_id: userId, organization_id: organizationId })

    if (updateError) {
      throw new Error(`Failed to update membership: ${updateError.message}`)
    }

    return
  }

  const { error } = await supabase
    .from("user_organization_memberships")
    .insert({ user_id: userId, organization_id: organizationId, roles })

  if (error) {
    throw new Error(`Failed to insert membership: ${error.message}`)
  }
}

async function main() {
  const orgExternalId = process.env.SEED_ORG_EXTERNAL_ID ?? "abode-ai"
  const orgName = process.env.SEED_ORG_NAME ?? "Abode AI"
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@abode.ai"
  const adminAuth0Id =
    process.env.SEED_ADMIN_AUTH0_ID ?? `seed-admin|${randomUUID()}`

  const organization = await ensureOrganization(orgExternalId, orgName)
  const user = await ensureUser({
    auth0UserId: adminAuth0Id,
    email: adminEmail,
    displayName: "Abode Admin",
  })

  await ensureMembership(user.id, organization.id, ["admin"])

  console.log(`Seeded organization ${organization.name} (${organization.external_ref})`)
  console.log(`Seeded admin user ${adminEmail}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
