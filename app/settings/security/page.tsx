import { DeviceManager } from "@/components/security/device-manager"
import { SecurityKeysManager } from "@/components/security/security-keys"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground">Manage sessions, hardware keys, and data privacy workflows.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DeviceManager />
        <SecurityKeysManager />
      </div>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Data retention & erasure</CardTitle>
          <CardDescription>Submit or complete data erasure workflows for regulatory compliance.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Use the compliance console to approve forget requests. Once approved, invoke the erasure endpoint or open a ticket with
            the privacy team for irreversible deletion across cold storage.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
