export const DEFAULT_ROLE = "designer"

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "pipelines:read",
    "pipelines:write",
    "pipelines:approve",
    "audit:read",
    "audit:write",
    "agents:publish",
    "org:manage",
  ],
  analyst: ["pipelines:read", "pipelines:write", "pipelines:approve", "audit:write"],
  designer: ["pipelines:read", "pipelines:write"],
  compliance: ["pipelines:read", "audit:read"],
  manufacturer: ["pipelines:read", "pipelines:approve"],
  freelancer: ["pipelines:read"],
}

export function collectUserPermissions(roles: string[] = []) {
  const permissions = new Set<string>()
  roles.forEach((role) => {
    const rolePermissions = ROLE_PERMISSIONS[role]
    rolePermissions?.forEach((permission) => permissions.add(permission))
  })
  return permissions
}

export function hasPermission(roles: string[], permission: string) {
  return collectUserPermissions(roles).has(permission)
}

export function requirePermission(roles: string[], permission: string) {
  if (!hasPermission(roles, permission)) {
    throw new Error(`Missing permission: ${permission}`)
  }
}
