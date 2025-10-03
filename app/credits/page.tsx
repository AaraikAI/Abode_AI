import { requireSession } from "@/lib/auth/session"
import { listCreditPacks } from "@/lib/data/credits"
import CreditMarketplace from "@/components/credits/credit-marketplace"

export default async function CreditsPage() {
  await requireSession({ enforceDevice: true, enforceGeo: true })
  const packs = await listCreditPacks()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <CreditMarketplace initialPacks={packs} />
      </div>
    </main>
  )
}
