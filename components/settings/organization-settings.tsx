"use client"

import { useCallback, useState, useMemo } from "react"
import useSWR from "swr"
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  Mail,
  UserPlus,
  MoreVertical,
  Crown,
  Trash2,
  Edit,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OrganizationMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: "owner" | "admin" | "member" | "viewer"
  status: "active" | "pending" | "suspended"
  joinedAt: string
  lastActive?: string
}

interface BillingInfo {
  plan: "free" | "pro" | "enterprise"
  seats: number
  usedSeats: number
  billingCycle: "monthly" | "annual"
  nextBillingDate?: string
  paymentMethod?: {
    type: "card" | "paypal"
    last4?: string
    expiryMonth?: number
    expiryYear?: number
  }
  totalSpend?: number
}

interface OrganizationData {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with ${response.status}`)
  }
  return response.json()
}

const roleColors = {
  owner: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  admin: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  member: "bg-green-500/10 text-green-700 dark:text-green-300",
  viewer: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
}

export function OrganizationSettings() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<OrganizationMember["role"]>("member")
  const [isInviting, setIsInviting] = useState(false)

  const { data: orgData, mutate: mutateOrg } = useSWR<{ organization: OrganizationData }>(
    "/api/organization",
    fetcher
  )

  const { data: membersData, mutate: mutateMembers } = useSWR<{ members: OrganizationMember[] }>(
    "/api/organization/members",
    fetcher
  )

  const { data: billingData } = useSWR<{ billing: BillingInfo }>("/api/organization/billing", fetcher)

  const organization = useMemo(() => orgData?.organization, [orgData])
  const members = useMemo(() => membersData?.members ?? [], [membersData])
  const billing = useMemo(() => billingData?.billing, [billingData])

  const handleInviteMember = useCallback(async () => {
    if (!inviteEmail) {
      toast({ title: "Email required", variant: "destructive" })
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch("/api/organization/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to send invitation")
      }

      await mutateMembers()
      setShowInviteDialog(false)
      setInviteEmail("")
      setInviteRole("member")
      toast({ title: "Invitation sent successfully" })
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }, [inviteEmail, inviteRole, mutateMembers, toast])

  const handleUpdateMemberRole = useCallback(
    async (memberId: string, newRole: OrganizationMember["role"]) => {
      try {
        const response = await fetch(`/api/organization/members/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update member role")
        }

        await mutateMembers()
        toast({ title: "Member role updated" })
      } catch (error) {
        toast({
          title: "Failed to update role",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [mutateMembers, toast]
  )

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      try {
        const response = await fetch(`/api/organization/members/${memberId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to remove member")
        }

        await mutateMembers()
        toast({ title: "Member removed successfully" })
      } catch (error) {
        toast({
          title: "Failed to remove member",
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [mutateMembers, toast]
  )

  return (
    <div className="space-y-6">
      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" value={organization?.name ?? ""} placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">URL Slug</Label>
              <Input id="org-slug" value={organization?.slug ?? ""} placeholder="acme-inc" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-website">Website</Label>
              <Input id="org-website" type="url" value={organization?.website ?? ""} placeholder="https://acme.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-industry">Industry</Label>
              <Select value={organization?.industry ?? ""}>
                <SelectTrigger id="org-industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="architecture">Architecture</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Manage your organization members and their roles</CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.role === "owner" && <Crown className="h-3 w-3 text-yellow-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[member.role]}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={member.role === "owner"}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Billing & Subscription
          </CardTitle>
          <CardDescription>Manage your subscription and payment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Plan</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-lg capitalize">
                  {billing?.plan ?? "Free"}
                </Badge>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Seats</Label>
              <p className="text-2xl font-semibold">
                {billing?.usedSeats ?? 0} / {billing?.seats ?? 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Billing Cycle</Label>
              <p className="text-lg font-medium capitalize">{billing?.billingCycle ?? "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Next Billing Date</Label>
              <p className="text-lg font-medium">
                {billing?.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
          {billing?.paymentMethod && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Payment Method</Label>
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {billing.paymentMethod.type === "card" ? "Credit Card" : "PayPal"}
                      </p>
                      {billing.paymentMethod.last4 && (
                        <p className="text-xs text-muted-foreground">
                          •••• {billing.paymentMethod.last4} - Expires {billing.paymentMethod.expiryMonth}/
                          {billing.paymentMethod.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: OrganizationMember["role"]) => setInviteRole(value)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
