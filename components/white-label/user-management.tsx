'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface TenantUser {
  id: string
  email: string
  name?: string
  role: UserRole
  status: UserStatus
  lastActive?: string
  invitedAt?: string
  createdAt: string
}

export interface SSOConfig {
  enabled: boolean
  provider?: 'saml' | 'oauth' | 'oidc'
  domain?: string
  metadataUrl?: string
  entityId?: string
}

export interface UserManagementProps {
  tenantId: string
  users: TenantUser[]
  ssoConfig?: SSOConfig
  maxUsers?: number
  onInviteUser?: (email: string, role: UserRole) => Promise<void>
  onUpdateUserRole?: (userId: string, role: UserRole) => Promise<void>
  onRemoveUser?: (userId: string) => Promise<void>
  onSuspendUser?: (userId: string) => Promise<void>
  onResendInvite?: (userId: string) => Promise<void>
  onUpdateSSOConfig?: (config: SSOConfig) => Promise<void>
  readOnly?: boolean
}

const roleLabels: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

const roleDescriptions: Record<UserRole, string> = {
  owner: 'Full access and billing control',
  admin: 'Can manage users and settings',
  member: 'Can edit and collaborate',
  viewer: 'Can view only',
}

export default function UserManagement({
  tenantId,
  users: initialUsers,
  ssoConfig: initialSSOConfig,
  maxUsers,
  onInviteUser,
  onUpdateUserRole,
  onRemoveUser,
  onSuspendUser,
  onResendInvite,
  onUpdateSSOConfig,
  readOnly = false,
}: UserManagementProps) {
  const [users, setUsers] = useState<TenantUser[]>(initialUsers)
  const [ssoConfig, setSSOConfig] = useState<SSOConfig>(
    initialSSOConfig || { enabled: false }
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [ssoDialogOpen, setSSODialogOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInvite = async () => {
    if (inviteEmail && inviteEmail.includes('@')) {
      await onInviteUser?.(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('viewer')
      setInviteDialogOpen(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    await onUpdateUserRole?.(userId, newRole)
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    )
  }

  const handleSSOSave = async () => {
    await onUpdateSSOConfig?.(ssoConfig)
    setSSODialogOpen(false)
  }

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        )
      case 'invited':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Invited
          </Badge>
        )
      case 'suspended':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Suspended
          </Badge>
        )
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      owner: 'bg-purple-500/10 text-purple-500',
      admin: 'bg-blue-500/10 text-blue-500',
      member: 'bg-green-500/10 text-green-500',
      viewer: 'bg-gray-500/10 text-gray-500',
    }
    return (
      <Badge variant="secondary" className={colors[role]}>
        <Shield className="h-3 w-3 mr-1" />
        {roleLabels[role]}
      </Badge>
    )
  }

  const activeUsers = users.filter(u => u.status === 'active').length
  const invitedUsers = users.filter(u => u.status === 'invited').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage tenant users, roles, invitations, and SSO configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Users</div>
            <div className="text-2xl font-bold">
              {activeUsers}
              {maxUsers && <span className="text-sm text-muted-foreground"> / {maxUsers}</span>}
            </div>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={readOnly || (maxUsers !== undefined && users.length >= maxUsers)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this tenant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <SelectItem key={role} value={role}>
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {roleDescriptions[role as UserRole]}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.includes('@')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SSO Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Single Sign-On (SSO)
              </CardTitle>
              <CardDescription>Configure SSO authentication for this tenant</CardDescription>
            </div>
            <Dialog open={ssoDialogOpen} onOpenChange={setSSODialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={readOnly}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>SSO Configuration</DialogTitle>
                  <DialogDescription>
                    Configure single sign-on settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Enable SSO</Label>
                      <p className="text-xs text-muted-foreground">
                        Require SSO authentication
                      </p>
                    </div>
                    <Switch
                      checked={ssoConfig.enabled}
                      onCheckedChange={(checked) =>
                        setSSOConfig(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>

                  {ssoConfig.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                          value={ssoConfig.provider || 'saml'}
                          onValueChange={(v) =>
                            setSSOConfig(prev => ({ ...prev, provider: v as SSOConfig['provider'] }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saml">SAML 2.0</SelectItem>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="oidc">OpenID Connect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Domain</Label>
                        <Input
                          placeholder="company.com"
                          value={ssoConfig.domain || ''}
                          onChange={(e) =>
                            setSSOConfig(prev => ({ ...prev, domain: e.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Metadata URL</Label>
                        <Input
                          placeholder="https://idp.example.com/metadata"
                          value={ssoConfig.metadataUrl || ''}
                          onChange={(e) =>
                            setSSOConfig(prev => ({ ...prev, metadataUrl: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSSODialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSSOSave}>Save Configuration</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={ssoConfig.enabled ? 'default' : 'secondary'}>
              {ssoConfig.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {ssoConfig.enabled && ssoConfig.provider && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">
                  {ssoConfig.provider.toUpperCase()}
                </span>
                {ssoConfig.domain && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-muted-foreground">{ssoConfig.domain}</span>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(roleLabels).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name || user.email}</div>
                    {user.name && (
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.status === 'active' && user.lastActive
                    ? new Date(user.lastActive).toLocaleDateString()
                    : user.status === 'invited' && user.invitedAt
                    ? `Invited ${new Date(user.invitedAt).toLocaleDateString()}`
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={readOnly}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === 'invited' && (
                        <>
                          <DropdownMenuItem onClick={() => onResendInvite?.(user.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {user.role !== 'owner' && (
                        <>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}>
                            Change to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'member')}>
                            Change to Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'viewer')}>
                            Change to Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {user.status === 'active' && user.role !== 'owner' && (
                        <DropdownMenuItem onClick={() => onSuspendUser?.(user.id)}>
                          Suspend User
                        </DropdownMenuItem>
                      )}
                      {user.role !== 'owner' && (
                        <DropdownMenuItem
                          onClick={() => onRemoveUser?.(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {invitedUsers > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {invitedUsers} pending invitation{invitedUsers !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
