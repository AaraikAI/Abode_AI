'use client'

/**
 * Push Notification Settings Component
 *
 * Configure push notifications, channels, and preferences
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  Moon,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  MessageSquare,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react'

export interface NotificationChannel {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sound: boolean
  vibration: boolean
  badge: boolean
}

export interface NotificationSchedule {
  enabled: boolean
  quietHoursStart: string // HH:MM format
  quietHoursEnd: string // HH:MM format
  daysOfWeek: number[] // 0-6, Sunday = 0
}

export interface NotificationPreferences {
  masterEnabled: boolean
  channels: NotificationChannel[]
  schedule: NotificationSchedule
  groupNotifications: boolean
  showPreviews: boolean
  persistentNotifications: boolean
  soundVolume: number
}

interface PushNotificationSettingsProps {
  preferences?: Partial<NotificationPreferences>
  onPreferencesChange?: (preferences: NotificationPreferences) => void
  onTestNotification?: () => void
}

const DEFAULT_CHANNELS: NotificationChannel[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'Chat messages and mentions',
    icon: MessageSquare,
    enabled: true,
    priority: 'high',
    sound: true,
    vibration: true,
    badge: true
  },
  {
    id: 'updates',
    name: 'Project Updates',
    description: 'Design changes and project milestones',
    icon: TrendingUp,
    enabled: true,
    priority: 'medium',
    sound: true,
    vibration: false,
    badge: true
  },
  {
    id: 'calendar',
    name: 'Calendar Events',
    description: 'Meetings and deadlines',
    icon: Calendar,
    enabled: true,
    priority: 'high',
    sound: true,
    vibration: true,
    badge: true
  },
  {
    id: 'alerts',
    name: 'System Alerts',
    description: 'Important system notifications',
    icon: AlertCircle,
    enabled: true,
    priority: 'urgent',
    sound: true,
    vibration: true,
    badge: true
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security alerts and login attempts',
    icon: Shield,
    enabled: true,
    priority: 'urgent',
    sound: true,
    vibration: true,
    badge: true
  },
  {
    id: 'info',
    name: 'Informational',
    description: 'Tips, news, and updates',
    icon: Info,
    enabled: false,
    priority: 'low',
    sound: false,
    vibration: false,
    badge: false
  }
]

const DEFAULT_PREFERENCES: NotificationPreferences = {
  masterEnabled: true,
  channels: DEFAULT_CHANNELS,
  schedule: {
    enabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
  },
  groupNotifications: true,
  showPreviews: true,
  persistentNotifications: false,
  soundVolume: 0.7
}

const PRIORITY_COLORS: Record<NotificationChannel['priority'], string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

export function PushNotificationSettings({
  preferences: initialPreferences,
  onPreferencesChange,
  onTestNotification
}: PushNotificationSettingsProps) {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_PREFERENCES,
    ...initialPreferences
  })

  /**
   * Update preferences and notify parent
   */
  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    onPreferencesChange?.(newPreferences)
  }

  /**
   * Toggle master notifications
   */
  const toggleMaster = (enabled: boolean) => {
    updatePreferences({ masterEnabled: enabled })
    toast({
      title: enabled ? 'Notifications Enabled' : 'Notifications Disabled',
      description: enabled
        ? 'You will receive push notifications'
        : 'All push notifications are disabled'
    })
  }

  /**
   * Update channel settings
   */
  const updateChannel = (channelId: string, updates: Partial<NotificationChannel>) => {
    const updatedChannels = preferences.channels.map(channel =>
      channel.id === channelId ? { ...channel, ...updates } : channel
    )
    updatePreferences({ channels: updatedChannels })
  }

  /**
   * Toggle quiet hours
   */
  const toggleQuietHours = (enabled: boolean) => {
    updatePreferences({
      schedule: { ...preferences.schedule, enabled }
    })
    toast({
      title: enabled ? 'Quiet Hours Enabled' : 'Quiet Hours Disabled',
      description: enabled
        ? `Notifications muted from ${preferences.schedule.quietHoursStart} to ${preferences.schedule.quietHoursEnd}`
        : 'You will receive notifications at all times'
    })
  }

  /**
   * Update quiet hours time
   */
  const updateQuietHours = (start: string, end: string) => {
    updatePreferences({
      schedule: {
        ...preferences.schedule,
        quietHoursStart: start,
        quietHoursEnd: end
      }
    })
  }

  /**
   * Toggle day of week for quiet hours
   */
  const toggleDay = (day: number) => {
    const days = preferences.schedule.daysOfWeek.includes(day)
      ? preferences.schedule.daysOfWeek.filter(d => d !== day)
      : [...preferences.schedule.daysOfWeek, day]

    updatePreferences({
      schedule: { ...preferences.schedule, daysOfWeek: days }
    })
  }

  /**
   * Send test notification
   */
  const sendTestNotification = () => {
    if (!preferences.masterEnabled) {
      toast({
        title: 'Notifications Disabled',
        description: 'Enable notifications to send a test',
        variant: 'destructive'
      })
      return
    }

    onTestNotification?.()
    toast({
      title: 'Test Notification Sent',
      description: 'Check your device for the notification'
    })
  }

  /**
   * Reset to defaults
   */
  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
    onPreferencesChange?.(DEFAULT_PREFERENCES)
    toast({
      title: 'Settings Reset',
      description: 'Notification preferences restored to defaults'
    })
  }

  const enabledChannels = preferences.channels.filter(c => c.enabled).length
  const totalChannels = preferences.channels.length

  return (
    <div className="space-y-6">
      {/* Master Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {preferences.masterEnabled ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
                Push Notifications
              </CardTitle>
              <CardDescription>
                Manage notification channels and preferences
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.masterEnabled}
                onCheckedChange={toggleMaster}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {enabledChannels} of {totalChannels} channels active
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={sendTestNotification}>
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Channels</CardTitle>
          <CardDescription>Configure individual notification types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.channels.map((channel, index) => (
            <div key={channel.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="space-y-3">
                {/* Channel Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${PRIORITY_COLORS[channel.priority]}`}>
                      <channel.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">{channel.name}</Label>
                        <Badge variant="outline" className="text-xs">
                          {channel.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={(enabled) => updateChannel(channel.id, { enabled })}
                    disabled={!preferences.masterEnabled}
                  />
                </div>

                {/* Channel Settings */}
                {channel.enabled && preferences.masterEnabled && (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${channel.id}-sound`}
                          checked={channel.sound}
                          onCheckedChange={(sound) => updateChannel(channel.id, { sound })}
                          className="scale-75"
                        />
                        <Label
                          htmlFor={`${channel.id}-sound`}
                          className="text-sm flex items-center gap-1"
                        >
                          <Volume2 className="h-3 w-3" />
                          Sound
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${channel.id}-vibration`}
                          checked={channel.vibration}
                          onCheckedChange={(vibration) =>
                            updateChannel(channel.id, { vibration })
                          }
                          className="scale-75"
                        />
                        <Label
                          htmlFor={`${channel.id}-vibration`}
                          className="text-sm flex items-center gap-1"
                        >
                          <Vibrate className="h-3 w-3" />
                          Vibrate
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${channel.id}-badge`}
                          checked={channel.badge}
                          onCheckedChange={(badge) => updateChannel(channel.id, { badge })}
                          className="scale-75"
                        />
                        <Label
                          htmlFor={`${channel.id}-badge`}
                          className="text-sm flex items-center gap-1"
                        >
                          Badge
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-20">Priority:</Label>
                      <Select
                        value={channel.priority}
                        onValueChange={(priority) =>
                          updateChannel(channel.id, {
                            priority: priority as NotificationChannel['priority']
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Quiet Hours
              </CardTitle>
              <CardDescription>Mute notifications during specific times</CardDescription>
            </div>
            <Switch
              checked={preferences.schedule.enabled}
              onCheckedChange={toggleQuietHours}
              disabled={!preferences.masterEnabled}
            />
          </div>
        </CardHeader>
        {preferences.schedule.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Start Time</Label>
                <Select
                  value={preferences.schedule.quietHoursStart}
                  onValueChange={(start) =>
                    updateQuietHours(start, preferences.schedule.quietHoursEnd)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">End Time</Label>
                <Select
                  value={preferences.schedule.quietHoursEnd}
                  onValueChange={(end) =>
                    updateQuietHours(preferences.schedule.quietHoursStart, end)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Active Days</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={
                      preferences.schedule.daysOfWeek.includes(value)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className="w-12"
                    onClick={() => toggleDay(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Additional Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Additional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="group-notifications">Group Notifications</Label>
            <Switch
              id="group-notifications"
              checked={preferences.groupNotifications}
              onCheckedChange={(groupNotifications) =>
                updatePreferences({ groupNotifications })
              }
              disabled={!preferences.masterEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-previews">Show Message Previews</Label>
            <Switch
              id="show-previews"
              checked={preferences.showPreviews}
              onCheckedChange={(showPreviews) => updatePreferences({ showPreviews })}
              disabled={!preferences.masterEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="persistent">Persistent Notifications</Label>
            <Switch
              id="persistent"
              checked={preferences.persistentNotifications}
              onCheckedChange={(persistentNotifications) =>
                updatePreferences({ persistentNotifications })
              }
              disabled={!preferences.masterEnabled}
            />
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={resetToDefaults} className="w-full">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
