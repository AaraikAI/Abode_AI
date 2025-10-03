import { redirect } from "next/navigation"

import { SignInButton } from "@/components/auth/sign-in-button"
import { requireSession } from "@/lib/auth/session"

export default async function SignInPage() {
  try {
    await requireSession()
    redirect("/dashboard")
  } catch {
    // user not signed in
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
        <h1 className="text-3xl font-semibold">Sign in to AbodeAI</h1>
        <p className="text-sm text-white/70">
          Use your enterprise SSO (Auth0/Entra). Developers may enable `DEV_AUTH_ENABLED=true` for local testing.
        </p>
        <SignInButton />
      </div>
    </main>
  )
}
