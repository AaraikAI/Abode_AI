"use client"

import { useTransition } from "react"
import useSWR from "swr"
import { KeyRound, Loader2 } from "lucide-react"
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface RegisteredKey {
  id: string
  createdAt: string
  label?: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to load keys")
  return res.json()
})

export function SecurityKeysManager() {
  const { toast } = useToast()
  const [isRegistering, startRegister] = useTransition()
  const [isAuthenticating, startAuth] = useTransition()
  const { data, mutate } = useSWR<{ keys: RegisteredKey[] }>("/api/internal/security/keys", fetcher)

  const register = () => {
    startRegister(async () => {
      try {
        const response = await fetch("/api/auth/webauthn/register", { method: "POST" })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to start registration")
        }
        const { options } = (await response.json()) as { options: any }
        const attestation = await startRegistration(options)
        const verifyRes = await fetch("/api/auth/webauthn/register/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attestation),
        })
        if (!verifyRes.ok) {
          const body = await verifyRes.json().catch(() => ({}))
          throw new Error(body.error || "Verification failed")
        }
        toast({ title: "Security key registered" })
        await mutate()
      } catch (error) {
        toast({ title: "Registration failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }

  const authenticate = () => {
    startAuth(async () => {
      try {
        const response = await fetch("/api/auth/webauthn/authenticate", { method: "POST" })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to start authentication")
        }
        const { options } = (await response.json()) as { options: any }
        const assertion = await startAuthentication(options)
        const verifyRes = await fetch("/api/auth/webauthn/authenticate/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assertion),
        })
        if (!verifyRes.ok) {
          const body = await verifyRes.json().catch(() => ({}))
          throw new Error(body.error || "Verification failed")
        }
        toast({ title: "Security key verified" })
      } catch (error) {
        toast({ title: "Authentication failed", description: (error as Error).message, variant: "destructive" })
      }
    })
  }

  return (
    <Card className="border border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Security keys</CardTitle>
        <CardDescription>Register WebAuthn-compatible hardware keys for phishing-resistant MFA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={register} disabled={isRegistering} className="gap-1">
            {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Register key
          </Button>
          <Button variant="outline" onClick={authenticate} disabled={isAuthenticating} className="gap-1">
            {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Test key
          </Button>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {data?.keys?.map((key) => (
            <div key={key.id} className="rounded-lg border border-border/40 bg-background/60 p-3">
              <p className="font-semibold text-foreground">{key.label ?? "Security key"}</p>
              <p>Registered {new Date(key.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {!data?.keys?.length ? <p>No keys registered.</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
