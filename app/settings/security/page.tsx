import { requireSession } from "@/lib/auth/session"
import { listUserDevices } from "@/lib/auth/store"
import { SecurityPanel } from "@/components/settings/security-panel"

export default async function SecuritySettingsPage() {
  const session = await requireSession({ enforceDevice: true, enforceGeo: true })
  const devices = await listUserDevices(session.user?.id as string)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Security</h1>
          <p className="text-sm text-muted-foreground">Manage trusted devices and WebAuthn security keys.</p>
        </div>
        <SecurityPanel initialData={{ devices }} />
      </div>
    </main>
  )
}
