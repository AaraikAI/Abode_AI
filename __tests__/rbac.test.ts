import { describe, expect, it } from "@jest/globals"

import { collectUserPermissions, hasPermission } from "@/lib/rbac"

describe("RBAC", () => {
  it("collects permissions for multiple roles", () => {
    const permissions = collectUserPermissions(["designer", "compliance"])
    expect(Array.from(permissions).sort()).toStrictEqual([
      "audit:read",
      "pipelines:read",
      "pipelines:write",
    ])
  })

  it("grants admin full access", () => {
    expect(hasPermission(["admin"], "audit:write")).toBe(true)
    expect(hasPermission(["admin"], "org:manage")).toBe(true)
  })
})
