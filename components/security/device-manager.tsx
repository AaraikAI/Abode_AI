"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { ShieldCheck, ShieldOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to load devices")
  return res.json()
})

export function DeviceManager() {
  const { toast } = useToast()
  const { data, mutate, isLoading } = useSWR<{ devices: DeviceRecord[] }>("/api/account/devices", fetcher)

  const toggleTrust = useCallback(
    async (device: DeviceRecord, trusted: boolean) => {
      try {
        const response = await fetch("/api/account/devices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: device.id, trusted }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to update device")
        }
        await mutate()
        toast({ title: trusted ? "Device trusted" : "Device untrusted", description: device.device_id })
      } catch (error) {
        toast({ title: "Update failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [mutate, toast]
  )

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Devices</CardTitle>
        <CardDescription>Manage trusted browsers and revoke suspicious sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3 text-sm">
            {isLoading ? <p className="text-muted-foreground">Loading devices…</p> : null}
            {data?.devices.map((device) => (
              <div key={device.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{device.device_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.user_agent?.slice(0, 120) ?? "Unknown agent"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      IP {device.ip_address ?? "-"} • {device.geo_country ?? "Unknown"} • Last seen {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "n/a"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={device.trusted} onCheckedChange={(value) => toggleTrust(device, Boolean(value))} aria-label="Toggle trust" />
                    {device.trusted ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldOff className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>
            ))}
            {!data?.devices?.length && !isLoading ? <p className="text-muted-foreground">No devices found.</p> : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
