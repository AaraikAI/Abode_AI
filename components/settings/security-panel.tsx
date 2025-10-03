"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"
import { Shield, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface DeviceRecord {
  id: string
  device_id: string
  user_agent?: string | null
  ip_address?: string | null
  geo_country?: string | null
  trusted: boolean
  last_seen_at?: string | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json()
}

interface SecurityPanelProps {
  initialData?: { devices: DeviceRecord[] }
}

export function SecurityPanel({ initialData }: SecurityPanelProps) {
  const { toast } = useToast()
  const { data, mutate } = useSWR<{ devices: DeviceRecord[] }>("/api/account/devices", fetcher, {
    fallbackData: initialData,
  })
  const [isRegistering, setIsRegistering] = useState(false)

  const toggleTrusted = useCallback(
    async (deviceId: string, trusted: boolean) => {
      try {
        const response = await fetch("/api/account/devices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, trusted }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update device")
        }
        await mutate()
        toast({ title: "Device updated" })
      } catch (error) {
        toast({ title: "Device update failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [mutate, toast]
  )

  const registerWebAuthn = useCallback(async () => {
    setIsRegistering(true)
    try {
      const optionsRes = await fetch("/api/auth/webauthn/register/options", { method: "POST" })
      if (!optionsRes.ok) {
        const body = await optionsRes.json().catch(() => ({}))
        throw new Error(body.error || "Unable to prepare registration")
      }
      const options = await optionsRes.json()
      const attestationResponse = await startRegistration(options)
      const verifyRes = await fetch("/api/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestationResponse),
      })
      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}))
        throw new Error(body.error || "Registration verification failed")
      }
      toast({ title: "Security key registered" })
    } catch (error) {
      toast({ title: "Registration failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsRegistering(false)
    }
  }, [toast])

  const authenticateWebAuthn = useCallback(async () => {
    try {
      const optionsRes = await fetch("/api/auth/webauthn/authenticate/options", { method: "POST" })
      if (!optionsRes.ok) {
        const body = await optionsRes.json().catch(() => ({}))
        throw new Error(body.error || "Unable to begin authentication")
      }
      const options = await optionsRes.json()
      const assertion = await startAuthentication(options)
      const verifyRes = await fetch("/api/auth/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      })
      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}))
        throw new Error(body.error || "Authentication verification failed")
      }
      toast({ title: "Security key verified" })
    } catch (error) {
      toast({ title: "Authentication failed", description: (error as Error).message, variant: "destructive" })
    }
  }, [toast])

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Security & MFA</CardTitle>
        <CardDescription>Manage trusted devices and WebAuthn security keys.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={registerWebAuthn} disabled={isRegistering} className="gap-2">
            <Shield className="h-4 w-4" /> Register security key
          </Button>
          <Button variant="outline" onClick={authenticateWebAuthn} className="gap-2">
            <Check className="h-4 w-4" /> Verify key
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Devices</h3>
          <div className="space-y-3 text-sm">
            {(data?.devices ?? []).map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 p-3">
                <div>
                  <div className="font-medium text-foreground">{device.device_id}</div>
                  <div className="text-xs text-muted-foreground">
                    {device.user_agent ?? "Unknown agent"}
                    {device.ip_address ? ` • ${device.ip_address}` : ""}
                    {device.geo_country ? ` • ${device.geo_country}` : ""}
                  </div>
                  {device.last_seen_at ? (
                    <div className="text-xs text-muted-foreground">
                      Last seen {new Date(device.last_seen_at).toLocaleString()}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={device.trusted} onCheckedChange={(value) => toggleTrusted(device.id, Boolean(value))} />
                  <span className="text-xs text-muted-foreground">Trusted</span>
                </div>
              </div>
            ))}
            {!data?.devices?.length ? <p className="text-xs text-muted-foreground">No devices recorded yet.</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
