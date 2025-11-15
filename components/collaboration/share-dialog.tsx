'use client'

import { useState, useEffect } from 'react'
import {
  Share2,
  Copy,
  Mail,
  Link as LinkIcon,
  Check,
  Globe,
  Lock,
  Users,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export type SharePermission = 'viewer' | 'editor' | 'admin'
export type LinkAccess = 'anyone' | 'organization' | 'specific'

export interface ShareSettings {
  linkAccess: LinkAccess
  permission: SharePermission
  expiresAt?: string
  requiresAuth: boolean
}

export interface ShareToken {
  token: string
  url: string
  createdAt: string
  expiresAt?: string
  accessCount?: number
}

interface ShareDialogProps {
  projectId: string
  projectName: string
  currentShareSettings?: ShareSettings
  shareToken?: ShareToken
  onInviteByEmail?: (email: string, permission: SharePermission) => void
  onUpdateSettings?: (settings: ShareSettings) => void
  onGenerateToken?: (settings: ShareSettings) => Promise<ShareToken>
  onRevokeToken?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShareDialog({
  projectId,
  projectName,
  currentShareSettings,
  shareToken,
  onInviteByEmail,
  onUpdateSettings,
  onGenerateToken,
  onRevokeToken,
  trigger,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('viewer')
  const [linkAccess, setLinkAccess] = useState<LinkAccess>(
    currentShareSettings?.linkAccess || 'specific'
  )
  const [linkPermission, setLinkPermission] = useState<SharePermission>(
    currentShareSettings?.permission || 'viewer'
  )
  const [requiresAuth, setRequiresAuth] = useState(
    currentShareSettings?.requiresAuth ?? true
  )
  const [expiresIn, setExpiresIn] = useState<string>('never')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInviteByEmail = () => {
    if (email && email.includes('@')) {
      onInviteByEmail?.(email, permission)
      setEmail('')
    }
  }

  const handleCopyLink = async () => {
    if (shareToken?.url) {
      await navigator.clipboard.writeText(shareToken.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerateLink = async () => {
    setIsGenerating(true)

    const expiresAt =
      expiresIn === 'never'
        ? undefined
        : new Date(
            Date.now() +
              (expiresIn === '1day'
                ? 24 * 60 * 60000
                : expiresIn === '7days'
                ? 7 * 24 * 60 * 60000
                : 30 * 24 * 60 * 60000)
          ).toISOString()

    const settings: ShareSettings = {
      linkAccess,
      permission: linkPermission,
      expiresAt,
      requiresAuth,
    }

    await onGenerateToken?.(settings)
    setIsGenerating(false)
  }

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{projectName}"
          </DialogTitle>
          <DialogDescription>
            Invite collaborators or share a link to this project
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Invite by Email
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Share Link
            </TabsTrigger>
          </TabsList>

          {/* Email Invite Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInviteByEmail()
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Permission Level</Label>
                <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Viewer</p>
                          <p className="text-xs text-muted-foreground">Can view only</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Editor</p>
                          <p className="text-xs text-muted-foreground">Can edit and comment</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Admin</p>
                          <p className="text-xs text-muted-foreground">Full control</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleInviteByEmail} className="w-full" disabled={!email.includes('@')}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </TabsContent>

          {/* Link Sharing Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Link Access */}
              <div className="space-y-2">
                <Label>Who can access this link?</Label>
                <Select value={linkAccess} onValueChange={(v) => setLinkAccess(v as LinkAccess)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Anyone with the link
                      </div>
                    </SelectItem>
                    <SelectItem value="organization">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Only people in your organization
                      </div>
                    </SelectItem>
                    <SelectItem value="specific">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Only specific people
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permission */}
              <div className="space-y-2">
                <Label>Permission Level</Label>
                <Select
                  value={linkPermission}
                  onValueChange={(v) => setLinkPermission(v as SharePermission)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>Link Expiration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="1day">1 day</SelectItem>
                    <SelectItem value="7days">7 days</SelectItem>
                    <SelectItem value="30days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Require Authentication */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Require Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Users must sign in to access
                  </p>
                </div>
                <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} />
              </div>

              <Separator />

              {/* Generated Link Display */}
              {shareToken ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input value={shareToken.url} readOnly className="font-mono text-xs" />
                    <Button onClick={handleCopyLink} variant="outline">
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Expires: {formatExpiryDate(shareToken.expiresAt)}</span>
                      {shareToken.accessCount !== undefined && (
                        <span>Accessed: {shareToken.accessCount} times</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onRevokeToken}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateLink}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Generate Share Link
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
