"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import { ShieldCheck, Globe, FileText, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import type { ComplianceEvent, ConsentRecord, ForgetRequest } from "@/lib/data/compliance"
import type { OrgGeoPolicy } from "@/lib/auth/store"

interface ComplianceDashboardProps {
  initialEvents: ComplianceEvent[]
  initialConsents: ConsentRecord[]
  initialForgetRequests: ForgetRequest[]
  initialGeoPolicy: OrgGeoPolicy | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Request failed")
  }
  return response.json()
}

export function ComplianceDashboard({
  initialEvents,
  initialConsents,
  initialForgetRequests,
  initialGeoPolicy,
}: ComplianceDashboardProps) {
  const { toast } = useToast()
  const [actorFilter, setActorFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [geoAllowed, setGeoAllowed] = useState<string[]>(initialGeoPolicy?.allowed_countries ?? [])
  const [geoBlocked, setGeoBlocked] = useState<string[]>(initialGeoPolicy?.blocked_countries ?? [])
  const [geoEnforced, setGeoEnforced] = useState<boolean>(initialGeoPolicy?.enforced ?? false)

  const { data: eventData, mutate: refreshEvents } = useSWR<{ events: ComplianceEvent[] }>(
    "/api/compliance/audit",
    fetcher,
    { fallbackData: { events: initialEvents } }
  )
  const { data: consentData, mutate: refreshConsents } = useSWR<{ consents: ConsentRecord[] }>(
    "/api/compliance/consents",
    fetcher,
    { fallbackData: { consents: initialConsents } }
  )
  const { data: forgetData, mutate: refreshForget } = useSWR<{ requests: ForgetRequest[] }>(
    "/api/compliance/forget",
    fetcher,
    { fallbackData: { requests: initialForgetRequests } }
  )

  const filteredEvents = useMemo(() => {
    return (eventData?.events ?? []).filter((event) => {
      const actorMatch = actorFilter ? event.actor?.toLowerCase().includes(actorFilter.toLowerCase()) : true
      const resourceMatch = resourceFilter
        ? (event.resource ?? "").toLowerCase().includes(resourceFilter.toLowerCase())
        : true
      return actorMatch && resourceMatch
    })
  }, [eventData?.events, actorFilter, resourceFilter])

  const handleConsentToggle = useCallback(
    async (id: string, granted: boolean) => {
      try {
        const response = await fetch("/api/compliance/consents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, granted }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update consent")
        }
        await refreshConsents()
        toast({ title: "Consent updated" })
      } catch (error) {
        toast({ title: "Consent update failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [refreshConsents, toast]
  )

  const handleForgetStatus = useCallback(
    async (id: string, status: string) => {
      try {
        const response = await fetch("/api/compliance/forget", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to update request")
        }
        await refreshForget()
        toast({ title: "Request updated" })
      } catch (error) {
        toast({ title: "Update failed", description: (error as Error).message, variant: "destructive" })
      }
    },
    [refreshForget, toast]
  )

  const handleGeoSave = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/geo-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedCountries: geoAllowed.filter(Boolean).map((item) => item.toUpperCase()),
          blockedCountries: geoBlocked.filter(Boolean).map((item) => item.toUpperCase()),
          enforced: geoEnforced,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Unable to update policy")
      }
      toast({ title: "Geo policy saved" })
    } catch (error) {
      toast({ title: "Geo policy failed", description: (error as Error).message, variant: "destructive" })
    }
  }, [geoAllowed, geoBlocked, geoEnforced, toast])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Audit events"
          value={(eventData?.events.length ?? initialEvents.length).toString()}
          description="Filtered by actor/resource"
        />
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          title="Consents"
          value={(consentData?.consents.length ?? initialConsents.length).toString()}
          description="Manage granted/withdrawn"
        />
        <SummaryCard
          icon={<Trash2 className="h-5 w-5" />}
          title="Forget requests"
          value={(forgetData?.requests.length ?? initialForgetRequests.length).toString()}
          description="Track lifecycle"
        />
        <SummaryCard
          icon={<Globe className="h-5 w-5" />}
          title="Geo policy"
          value={geoEnforced ? "Enforced" : "Advisory"}
          description={`${geoAllowed.length} allowed / ${geoBlocked.length} blocked`}
        />
      </div>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
          <CardDescription>Filter by actor or resource key.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Filter actor"
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value)}
              className="w-full sm:w-64"
            />
            <Input
              placeholder="Filter resource"
              value={resourceFilter}
              onChange={(event) => setResourceFilter(event.target.value)}
              className="w-full sm:w-64"
            />
            <Button variant="outline" onClick={() => refreshEvents()}>
              Refresh
            </Button>
          </div>
          <ScrollArea className="h-72">
            <div className="space-y-3 text-sm">
              {filteredEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{event.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Actor: {event.actor ?? "unknown"}
                    {event.resource ? ` • Resource: ${event.resource}` : ""}
                  </div>
                  {event.metadata ? (
                    <pre className="mt-2 overflow-auto rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
              {!filteredEvents.length ? <p className="text-xs text-muted-foreground">No matches found.</p> : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Consent records</CardTitle>
          <CardDescription>Toggle consent for individual users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(consentData?.consents ?? []).map((consent) => (
            <div key={consent.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 p-3">
              <div>
                <div className="font-medium text-foreground">{consent.consentType}</div>
                <div className="text-xs text-muted-foreground">User: {consent.userId}</div>
              </div>
              <Switch checked={consent.granted} onCheckedChange={(value) => handleConsentToggle(consent.id, value)} />
            </div>
          ))}
          {!consentData?.consents.length ? (
            <p className="text-xs text-muted-foreground">No consent records for this organisation.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Forget requests</CardTitle>
          <CardDescription>Approve or deny right-to-forget workflows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(forgetData?.requests ?? []).map((request) => (
            <div key={request.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{request.userId}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{request.status}</span>
              </div>
              {request.reason ? <p className="text-xs text-muted-foreground">{request.reason}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleForgetStatus(request.id, "in_progress")}
                >
                  Mark in progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleForgetStatus(request.id, "fulfilled")}
                >
                  Fulfill
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => handleForgetStatus(request.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {!forgetData?.requests.length ? (
            <p className="text-xs text-muted-foreground">No active forget requests.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Geo-fencing policy</CardTitle>
          <CardDescription>Control where users can access the platform from.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={geoEnforced} onCheckedChange={setGeoEnforced} />
            <span>Enforce allowed country list</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Allowed countries (ISO codes)</label>
              <Textarea
                rows={3}
                value={geoAllowed.join("\n")}
                onChange={(event) => setGeoAllowed(event.target.value.split(/\s+/).filter(Boolean))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Blocked countries</label>
              <Textarea
                rows={3}
                value={geoBlocked.join("\n")}
                onChange={(event) => setGeoBlocked(event.target.value.split(/\s+/).filter(Boolean))}
              />
            </div>
          </div>
          <Button variant="secondary" className="self-start" onClick={handleGeoSave}>
            Save policy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) {
  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
