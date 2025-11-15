'use client'

import { useState } from 'react'
import { Shield, UserPlus, Trash2, Crown, Edit, Eye, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type UserRole = 'owner' | 'editor' | 'viewer'

export interface ProjectMember {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  addedAt: string
  addedBy?: string
}

interface PermissionManagerProps {
  members: ProjectMember[]
  currentUserId?: string
  projectName?: string
  onAddMember?: (email: string, role: UserRole) => void
  onUpdateRole?: (memberId: string, newRole: UserRole) => void
  onRemoveMember?: (memberId: string) => void
  canManagePermissions?: boolean
}

const ROLE_INFO: Record<
  UserRole,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    color: string
  }
> = {
  owner: {
    label: 'Owner',
    icon: Crown,
    description: 'Full access including project deletion',
    color: 'text-purple-600',
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    description: 'Can edit and manage project content',
    color: 'text-blue-600',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    description: 'Can only view project content',
    color: 'text-gray-600',
  },
}

export function PermissionManager({
  members,
  currentUserId,
  projectName = 'this project',
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  canManagePermissions = true,
}: PermissionManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('viewer')
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleAddMember = () => {
    if (newMemberEmail && newMemberEmail.includes('@')) {
      onAddMember?.(newMemberEmail, newMemberRole)
      setNewMemberEmail('')
      setNewMemberRole('viewer')
      setShowAddDialog(false)
    }
  }

  const handleRemoveMember = () => {
    if (removeMemberId) {
      onRemoveMember?.(removeMemberId)
      setRemoveMemberId(null)
    }
  }

  const currentUserMember = members.find(m => m.id === currentUserId)
  const isOwner = currentUserMember?.role === 'owner'
  const canEdit = canManagePermissions && (isOwner || currentUserMember?.role === 'editor')

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Permissions</h3>
              <Badge variant="secondary">{members.length} members</Badge>
            </div>

            {canEdit && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          {/* Role Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(ROLE_INFO) as [UserRole, typeof ROLE_INFO[UserRole]][]).map(
              ([role, info]) => {
                const Icon = info.icon
                return (
                  <Card key={role} className="p-3">
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 ${info.color}`} />
                      <div>
                        <p className="font-medium text-sm">{info.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              }
            )}
          </div>

          {/* Members Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => {
                  const roleInfo = ROLE_INFO[member.role]
                  const RoleIcon = roleInfo.icon
                  const isCurrentUser = member.id === currentUserId
                  const canModify = canEdit && !isCurrentUser && member.role !== 'owner'

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name ? getInitials(member.name) : <Mail className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.name || member.email}
                              {isCurrentUser && (
                                <span className="text-muted-foreground ml-2">(You)</span>
                              )}
                            </p>
                            {member.name && (
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canModify ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              onUpdateRole?.(member.id, value as UserRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-3 w-3" />
                                  Viewer
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Edit className="h-3 w-3" />
                                  Editor
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                            {roleInfo.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(member.addedAt)}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {canModify && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveMemberId(member.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Invite someone to collaborate on {projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      <div>
                        <p className="font-medium">Viewer</p>
                        <p className="text-xs text-muted-foreground">Can only view</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="h-3 w-3" />
                      <div>
                        <p className="font-medium">Editor</p>
                        <p className="text-xs text-muted-foreground">Can edit and manage</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberEmail.includes('@')}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeMemberId !== null} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will lose access to {projectName}. They can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
