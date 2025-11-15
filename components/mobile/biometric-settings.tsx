'use client'

/**
 * Biometric Settings Component
 *
 * Configure biometric authentication (Face ID, Touch ID, fingerprint)
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  Fingerprint,
  Scan,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Eye,
  Clock,
  Settings,
  RefreshCw,
  Trash2,
  Plus,
  Info
} from 'lucide-react'

export interface BiometricCapability {
  type: 'face' | 'fingerprint' | 'iris' | 'voice'
  available: boolean
  enrolled: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface BiometricSettings {
  enabled: boolean
  capabilities: BiometricCapability[]
  requireForLogin: boolean
  requireForPayments: boolean
  requireForSensitiveData: boolean
  fallbackToPassword: boolean
  maxAttempts: number
  lockoutDuration: number // in seconds
  reAuthInterval: number // in minutes
}

export interface BiometricAttempt {
  id: string
  type: 'face' | 'fingerprint' | 'iris' | 'voice'
  timestamp: string
  success: boolean
  action: 'login' | 'payment' | 'unlock' | 'verify'
  deviceId: string
}

interface BiometricSettingsProps {
  settings?: Partial<BiometricSettings>
  recentAttempts?: BiometricAttempt[]
  onSettingsChange?: (settings: BiometricSettings) => void
  onEnrollBiometric?: (type: BiometricCapability['type']) => Promise<boolean>
  onRemoveBiometric?: (type: BiometricCapability['type']) => Promise<boolean>
  onTestBiometric?: (type: BiometricCapability['type']) => Promise<boolean>
}

const DEFAULT_CAPABILITIES: BiometricCapability[] = [
  {
    type: 'face',
    available: false,
    enrolled: false,
    label: 'Face ID',
    icon: Scan
  },
  {
    type: 'fingerprint',
    available: false,
    enrolled: false,
    label: 'Fingerprint',
    icon: Fingerprint
  },
  {
    type: 'iris',
    available: false,
    enrolled: false,
    label: 'Iris Scan',
    icon: Eye
  },
  {
    type: 'voice',
    available: false,
    enrolled: false,
    label: 'Voice Recognition',
    icon: Settings
  }
]

const DEFAULT_SETTINGS: BiometricSettings = {
  enabled: false,
  capabilities: DEFAULT_CAPABILITIES,
  requireForLogin: true,
  requireForPayments: true,
  requireForSensitiveData: true,
  fallbackToPassword: true,
  maxAttempts: 3,
  lockoutDuration: 300, // 5 minutes
  reAuthInterval: 30 // 30 minutes
}

export function BiometricSettings({
  settings: initialSettings,
  recentAttempts = [],
  onSettingsChange,
  onEnrollBiometric,
  onRemoveBiometric,
  onTestBiometric
}: BiometricSettingsProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<BiometricSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  })
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollingType, setEnrollingType] = useState<BiometricCapability['type'] | null>(null)
  const [enrollmentProgress, setEnrollmentProgress] = useState(0)

  useEffect(() => {
    // Check for biometric capabilities on mount
    checkBiometricSupport()
  }, [])

  /**
   * Check device biometric support
   */
  const checkBiometricSupport = async () => {
    try {
      // Check if Web Authentication API is available
      const isWebAuthnSupported = !!window.PublicKeyCredential

      // Simulate checking device capabilities
      const updatedCapabilities = settings.capabilities.map(cap => {
        // In a real implementation, this would check actual device capabilities
        let available = false

        if (cap.type === 'fingerprint' && isWebAuthnSupported) {
          available = true
        } else if (cap.type === 'face' && isWebAuthnSupported) {
          // Face ID typically only on iOS/macOS
          available = navigator.userAgent.includes('Mac')
        }

        return { ...cap, available }
      })

      updateSettings({ capabilities: updatedCapabilities })
    } catch (error) {
      console.error('Failed to check biometric support:', error)
    }
  }

  /**
   * Update settings and notify parent
   */
  const updateSettings = (updates: Partial<BiometricSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  /**
   * Enroll biometric
   */
  const handleEnroll = async (type: BiometricCapability['type']) => {
    setIsEnrolling(true)
    setEnrollingType(type)
    setEnrollmentProgress(0)

    try {
      // Simulate enrollment progress
      const progressInterval = setInterval(() => {
        setEnrollmentProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      const success = await onEnrollBiometric?.(type)

      clearInterval(progressInterval)
      setEnrollmentProgress(100)

      if (success) {
        const updatedCapabilities = settings.capabilities.map(cap =>
          cap.type === type ? { ...cap, enrolled: true } : cap
        )
        updateSettings({ capabilities: updatedCapabilities })

        toast({
          title: 'Biometric Enrolled',
          description: `${type} authentication is now active`
        })
      } else {
        throw new Error('Enrollment failed')
      }
    } catch (error: any) {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll biometric',
        variant: 'destructive'
      })
    } finally {
      setIsEnrolling(false)
      setEnrollingType(null)
      setEnrollmentProgress(0)
    }
  }

  /**
   * Remove biometric
   */
  const handleRemove = async (type: BiometricCapability['type'], label: string) => {
    if (!confirm(`Remove ${label}? You will need to re-enroll to use it again.`)) {
      return
    }

    try {
      const success = await onRemoveBiometric?.(type)

      if (success) {
        const updatedCapabilities = settings.capabilities.map(cap =>
          cap.type === type ? { ...cap, enrolled: false } : cap
        )
        updateSettings({ capabilities: updatedCapabilities })

        toast({
          title: 'Biometric Removed',
          description: `${label} has been removed`
        })
      }
    } catch (error: any) {
      toast({
        title: 'Removal Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  /**
   * Test biometric
   */
  const handleTest = async (type: BiometricCapability['type'], label: string) => {
    try {
      toast({
        title: 'Testing Biometric',
        description: `Please authenticate with ${label}...`
      })

      const success = await onTestBiometric?.(type)

      if (success) {
        toast({
          title: 'Test Successful',
          description: `${label} is working correctly`
        })
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  /**
   * Toggle master biometric setting
   */
  const toggleBiometrics = (enabled: boolean) => {
    if (enabled && !hasEnrolledBiometric) {
      toast({
        title: 'No Biometrics Enrolled',
        description: 'Please enroll at least one biometric method first',
        variant: 'destructive'
      })
      return
    }

    updateSettings({ enabled })
    toast({
      title: enabled ? 'Biometrics Enabled' : 'Biometrics Disabled',
      description: enabled
        ? 'Biometric authentication is now active'
        : 'Biometric authentication is disabled'
    })
  }

  const hasEnrolledBiometric = settings.capabilities.some(cap => cap.enrolled)
  const availableCapabilities = settings.capabilities.filter(cap => cap.available)
  const enrolledCount = settings.capabilities.filter(cap => cap.enrolled).length

  const recentSuccessful = recentAttempts.filter(a => a.success).length
  const recentFailed = recentAttempts.filter(a => !a.success).length

  return (
    <div className="space-y-6">
      {/* Master Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Biometric Authentication
              </CardTitle>
              <CardDescription>
                Use biometrics for secure, password-free access
              </CardDescription>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={toggleBiometrics}
              disabled={!hasEnrolledBiometric}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{enrolledCount}</div>
              <div className="text-xs text-muted-foreground">Enrolled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{recentSuccessful}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{recentFailed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Biometrics Available Warning */}
      {availableCapabilities.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Biometrics Available</AlertTitle>
          <AlertDescription>
            This device does not support biometric authentication.
          </AlertDescription>
        </Alert>
      )}

      {/* Enrollment Progress */}
      {isEnrolling && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Enrolling {enrollingType}...</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <Progress value={enrollmentProgress} />
              <div className="text-xs">Follow the on-screen instructions</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Biometric Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Methods</CardTitle>
          <CardDescription>Enroll and manage biometric methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.capabilities.map((capability, index) => {
            const Icon = capability.icon
            const isAvailable = capability.available
            const isEnrolled = capability.enrolled

            return (
              <div key={capability.type}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={isAvailable ? 'text-primary' : 'text-muted-foreground'}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">{capability.label}</Label>
                        {!isAvailable && (
                          <Badge variant="outline" className="text-xs">
                            Not Available
                          </Badge>
                        )}
                        {isEnrolled && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enrolled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isAvailable
                          ? isEnrolled
                            ? 'Active and ready to use'
                            : 'Available for enrollment'
                          : 'Not supported on this device'}
                      </p>
                    </div>
                  </div>

                  {isAvailable && (
                    <div className="flex gap-2">
                      {isEnrolled ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTest(capability.type, capability.label)}
                            disabled={!settings.enabled}
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(capability.type, capability.label)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEnroll(capability.type)}
                          disabled={isEnrolling}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Enroll
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure when biometrics are required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="require-login">Require for Login</Label>
            <Switch
              id="require-login"
              checked={settings.requireForLogin}
              onCheckedChange={(requireForLogin) => updateSettings({ requireForLogin })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="require-payments">Require for Payments</Label>
            <Switch
              id="require-payments"
              checked={settings.requireForPayments}
              onCheckedChange={(requireForPayments) => updateSettings({ requireForPayments })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="require-sensitive">Require for Sensitive Data</Label>
            <Switch
              id="require-sensitive"
              checked={settings.requireForSensitiveData}
              onCheckedChange={(requireForSensitiveData) =>
                updateSettings({ requireForSensitiveData })
              }
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="fallback-password">Fallback to Password</Label>
              <p className="text-xs text-muted-foreground">
                Allow password login if biometric fails
              </p>
            </div>
            <Switch
              id="fallback-password"
              checked={settings.fallbackToPassword}
              onCheckedChange={(fallbackToPassword) => updateSettings({ fallbackToPassword })}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Maximum Attempts</Label>
              <Badge variant="outline">{settings.maxAttempts}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Number of failed attempts before temporary lockout
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Lockout Duration</Label>
              <Badge variant="outline">{settings.lockoutDuration / 60} minutes</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Time before you can try again after max attempts
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Re-authentication Interval</Label>
              <Badge variant="outline">{settings.reAuthInterval} minutes</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              How often to require biometric verification
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last {recentAttempts.length} authentication attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAttempts.slice(0, 5).map((attempt, index) => {
                const capability = settings.capabilities.find(c => c.type === attempt.type)
                const Icon = capability?.icon || Fingerprint

                return (
                  <div key={attempt.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {attempt.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{attempt.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
