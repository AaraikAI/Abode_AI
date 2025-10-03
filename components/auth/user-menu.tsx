"use client"

import { LogOut, ShieldCheck, UserCircle } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatName(name?: string | null, email?: string | null) {
  if (name && name.trim().length > 0) return name
  if (email) return email.split("@")[0]
  return "User"
}

export function UserMenu() {
  const { data } = useSession()
  const user = data?.user

  if (!user) {
    return null
  }

  const displayName = formatName(user.name, user.email)
  const initials = displayName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{displayName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <span className="text-xs text-muted-foreground">Org: {user.orgExternalId ?? user.orgId}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {user.roles?.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
        <DropdownMenuItem className="flex-col items-start gap-1" disabled>
          <span className="flex items-center gap-2 text-xs uppercase tracking-tight text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Permissions
          </span>
          <span className="break-words text-xs leading-tight text-muted-foreground">
            {user.permissions?.join(", ") || "None"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
