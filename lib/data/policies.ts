import { supabase } from "@/lib/db/supabase"

export interface OrgMember {
  membershipId: string
  userId: string
  email?: string | null
  displayName?: string | null
  roles: string[]
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("user_organization_memberships")
    .select(
      `id, user_id, roles,
       users:user_id (email, display_name)
      `
    )
    .eq("organization_id", orgId)

  if (error) {
    throw new Error(`Failed to list org members: ${error.message}`)
  }

  return (data ?? []).map((row: any) => ({
    membershipId: row.id,
    userId: row.user_id,
    email: row.users?.email ?? null,
    displayName: row.users?.display_name ?? null,
    roles: row.roles ?? [],
  }))
}

export async function updateMemberRoles(params: { membershipId: string; roles: string[] }) {
  const { error } = await supabase
    .from("user_organization_memberships")
    .update({ roles: params.roles })
    .eq("id", params.membershipId)

  if (error) {
    throw new Error(`Failed to update member roles: ${error.message}`)
  }
}
