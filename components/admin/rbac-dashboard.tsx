"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import type { OrgMember } from "@/lib/data/policies"
import { ROLE_PERMISSIONS } from "@/lib/rbac"

interface RbacDashboardProps {
  initialMembers: OrgMember[]
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json()
}

const allRoles = Object.keys(ROLE_PERMISSIONS)

export function RbacDashboard({ initialMembers }: RbacDashboardProps) {
  const { toast } = useToast()
  const { data, mutate } = useSWR<{ members: OrgMember[] }>("/api/admin/rbac/members", fetcher, {
    fallbackData: { members: initialMembers },
  })

  const members = data?.members ?? initialMembers

  const toggleRole = useCallback(
    async (member: OrgMember, role: string, checked: boolean) => {
      const nextRoles = checked
        ? Array.from(new Set([...(member.roles ?? []), role]))
        : (member.roles ?? []).filter((r) => r !== role)

      try {
        const response = await fetch("/api/admin/rbac/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipId: member.membershipId, roles: nextRoles }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update roles")
        }
        await mutate()
        toast({ title: "Roles updated", description: `${member.email ?? member.userId} → ${nextRoles.join(", ")}` })
      } catch (error) {
        toast({ title: "Role update failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [mutate, toast]
  )

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Role-based access</CardTitle>
        <CardDescription>Assign roles and review permission coverage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[28rem]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Member</th>
                {allRoles.map((role) => (
                  <th key={role} className="px-4 py-2 text-center capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {members.map((member) => (
                <tr key={member.membershipId}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{member.displayName ?? member.email ?? member.userId}</div>
                    <div className="text-xs text-muted-foreground">{member.email ?? member.userId}</div>
                  </td>
                  {allRoles.map((role) => {
                    const checked = member.roles?.includes(role) ?? false
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleRole(member, role, Boolean(value))}
                          aria-label={`Toggle ${role} for ${member.displayName ?? member.userId}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Role permissions</p>
          {allRoles.map((role) => (
            <div key={role} className="flex flex-wrap items-start gap-2">
              <span className="min-w-[120px] font-semibold capitalize text-foreground">{role}</span>
              <span>{ROLE_PERMISSIONS[role].join(", ")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
