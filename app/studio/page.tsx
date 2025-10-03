import { requireSession } from "@/lib/auth/session"
import DesignStudio from "@/components/studio/design-studio"

export default async function StudioPage() {
  await requireSession({ enforceDevice: true, enforceGeo: true })

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <DesignStudio />
      </div>
    </main>
  )
}
