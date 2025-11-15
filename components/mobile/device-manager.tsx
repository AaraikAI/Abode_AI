'use client'

/**
 * Device Manager Component
 *
 * Manage linked mobile devices, sessions, and remote logout
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  Smartphone,
  Tablet,
  Monitor,
  Watch,
  MapPin,
  Clock,
  Shield,
  LogOut,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Chrome,
  Safari,
  Globe,
  Wifi,
  Battery,
  Activity,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface DeviceSession {
  id: string
  deviceId: string
  deviceName: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'watch' | 'other'
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other'
  browser?: string
  appVersion?: string
  isCurrentDevice: boolean
  isTrusted: boolean
  status: 'active' | 'idle' | 'offline'
  lastActive: string
  lastLocation?: {
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  ipAddress?: string
  batteryLevel?: number
  networkType?: 'wifi' | 'cellular' | 'ethernet' | 'offline'
  sessionStart: string
  loginMethod: 'password' | 'biometric' | 'sso' | 'token'
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'failed_login' | 'device_added' | 'device_removed' | 'suspicious'
  deviceId: string
  deviceName: string
  timestamp: string
  location?: string
  ipAddress?: string
  success: boolean
  details?: string
}

interface DeviceManagerProps {
  currentDeviceId: string
  devices: DeviceSession[]
  securityEvents?: SecurityEvent[]
  maxDevices?: number
  onLogoutDevice?: (deviceId: string) => void
  onRemoveDevice?: (deviceId: string) => void
  onTrustDevice?: (deviceId: string, trusted: boolean) => void
  onRefresh?: () => void
  onViewLocation?: (location: DeviceSession['lastLocation']) => void
}

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  watch: Watch,
  other: Globe
}

const PLATFORM_ICONS = {
  ios: Smartphone,
  android: Smartphone,
  windows: Monitor,
  macos: Monitor,
  linux: Monitor,
  other: Globe
}

const STATUS_COLORS = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500'
}

const STATUS_VARIANTS = {
  active: 'default',
  idle: 'secondary',
  offline: 'outline'
} as const

const NETWORK_ICONS = {
  wifi: Wifi,
  cellular: Activity,
  ethernet: Wifi,
  offline: XCircle
}

export function DeviceManager({
  currentDeviceId,
  devices,
  securityEvents = [],
  maxDevices = 10,
  onLogoutDevice,
  onRemoveDevice,
  onTrustDevice,
  onRefresh,
  onViewLocation
}: DeviceManagerProps) {
  const { toast } = useToast()
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  /**
   * Logout device session
   */
  const handleLogout = (device: DeviceSession) => {
    if (device.isCurrentDevice) {
      if (!confirm('This will log you out of this device. Continue?')) {
        return
      }
    } else {
      if (!confirm(`Log out ${device.deviceName}?`)) {
        return
      }
    }

    onLogoutDevice?.(device.id)
    toast({
      title: 'Device Logged Out',
      description: `${device.deviceName} has been logged out`
    })
  }

  /**
   * Remove device from account
   */
  const handleRemove = (device: DeviceSession) => {
    if (device.isCurrentDevice) {
      toast({
        title: 'Cannot Remove Current Device',
        description: 'You cannot remove the device you are currently using',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Remove ${device.deviceName} from your account? This device will need to login again.`)) {
      return
    }

    onRemoveDevice?.(device.id)
    toast({
      title: 'Device Removed',
      description: `${device.deviceName} has been removed from your account`
    })
  }

  /**
   * Toggle device trust status
   */
  const handleTrust = (device: DeviceSession) => {
    const newTrustStatus = !device.isTrusted
    onTrustDevice?.(device.id, newTrustStatus)
    toast({
      title: newTrustStatus ? 'Device Trusted' : 'Device Untrusted',
      description: newTrustStatus
        ? `${device.deviceName} is now trusted`
        : `${device.deviceName} is no longer trusted`
    })
  }

  /**
   * Logout all other devices
   */
  const handleLogoutAll = () => {
    const otherDevices = devices.filter(d => !d.isCurrentDevice)
    if (otherDevices.length === 0) {
      toast({
        title: 'No Other Devices',
        description: 'This is the only active device'
      })
      return
    }

    if (!confirm(`Log out all ${otherDevices.length} other device(s)?`)) {
      return
    }

    otherDevices.forEach(device => onLogoutDevice?.(device.id))
    toast({
      title: 'All Devices Logged Out',
      description: `${otherDevices.length} device(s) have been logged out`
    })
  }

  /**
   * Get time ago string
   */
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const activeDevices = devices.filter(d => d.status === 'active').length
  const trustedDevices = devices.filter(d => d.isTrusted).length
  const recentEvents = securityEvents.slice(0, 10)
  const isNearLimit = devices.length >= maxDevices * 0.8

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{devices.length}</div>
                <div className="text-xs text-muted-foreground">Total Devices</div>
              </div>
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-500">{activeDevices}</div>
                <div className="text-xs text-muted-foreground">Active Now</div>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-500">{trustedDevices}</div>
                <div className="text-xs text-muted-foreground">Trusted</div>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Limit Warning */}
      {isNearLimit && (
        <Alert variant={devices.length >= maxDevices ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Device Limit Warning</AlertTitle>
          <AlertDescription>
            {devices.length >= maxDevices
              ? `You have reached the maximum of ${maxDevices} devices. Remove a device to add a new one.`
              : `You are using ${devices.length} of ${maxDevices} allowed devices.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Devices List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Devices</CardTitle>
              <CardDescription>Manage devices with access to your account</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {devices.filter(d => !d.isCurrentDevice).length > 0 && (
                <Button size="sm" variant="outline" onClick={handleLogoutAll}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout All Others
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {devices.map((device, index) => {
                const DeviceIcon = DEVICE_ICONS[device.deviceType]
                const NetworkIcon = device.networkType ? NETWORK_ICONS[device.networkType] : null
                const isExpanded = selectedDevice === device.id

                return (
                  <div key={device.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{device.deviceName}</span>
                                {device.isCurrentDevice && (
                                  <Badge variant="default">This Device</Badge>
                                )}
                                {device.isTrusted && (
                                  <Shield className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant={STATUS_VARIANTS[device.status]} className="text-xs">
                                  <div className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[device.status]} mr-1`} />
                                  {device.status}
                                </Badge>
                                <span>{device.platform}</span>
                                {device.browser && <span>• {device.browser}</span>}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setSelectedDevice(isExpanded ? null : device.id)}
                                >
                                  {isExpanded ? 'Hide' : 'Show'} Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTrust(device)}>
                                  {device.isTrusted ? 'Untrust' : 'Trust'} Device
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleLogout(device)}>
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Logout
                                </DropdownMenuItem>
                                {!device.isCurrentDevice && (
                                  <DropdownMenuItem
                                    onClick={() => handleRemove(device)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeAgo(device.lastActive)}
                            </div>
                            {device.lastLocation && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {device.lastLocation.city}, {device.lastLocation.country}
                              </div>
                            )}
                            {device.batteryLevel !== undefined && (
                              <div className="flex items-center gap-1">
                                <Battery className="h-3 w-3" />
                                {device.batteryLevel}%
                              </div>
                            )}
                            {NetworkIcon && (
                              <div className="flex items-center gap-1">
                                <NetworkIcon className="h-3 w-3" />
                                {device.networkType}
                              </div>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mt-3 p-3 bg-muted rounded-lg space-y-2 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-muted-foreground">Device ID</div>
                                  <div className="font-mono">{device.deviceId.slice(0, 16)}...</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Session Start</div>
                                  <div>{new Date(device.sessionStart).toLocaleString()}</div>
                                </div>
                                {device.ipAddress && (
                                  <div>
                                    <div className="text-muted-foreground">IP Address</div>
                                    <div className="font-mono">{device.ipAddress}</div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-muted-foreground">Login Method</div>
                                  <div className="capitalize">{device.loginMethod}</div>
                                </div>
                                {device.appVersion && (
                                  <div>
                                    <div className="text-muted-foreground">App Version</div>
                                    <div>{device.appVersion}</div>
                                  </div>
                                )}
                              </div>
                              {device.lastLocation?.coordinates && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => onViewLocation?.(device.lastLocation)}
                                >
                                  <MapPin className="h-3 w-3 mr-2" />
                                  View on Map
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Security Activity */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recent Security Activity
            </CardTitle>
            <CardDescription>Last 10 security events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentEvents.map((event, index) => (
                  <div key={event.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-start gap-3">
                      {event.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm capitalize">
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(event.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.deviceName}
                          {event.location && ` • ${event.location}`}
                          {event.ipAddress && ` • ${event.ipAddress}`}
                        </div>
                        {event.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
