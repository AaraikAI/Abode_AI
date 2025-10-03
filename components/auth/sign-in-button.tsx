"use client"

import { useCallback, useMemo, useState } from "react"
import { LogIn, ShieldCheck } from "lucide-react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === "true"

export function SignInButton() {
  const [isSubmitting, setSubmitting] = useState(false)

  const primaryProvider = useMemo(() => (process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "auth0"), [])

  const handlePrimarySignIn = useCallback(async () => {
    setSubmitting(true)
    try {
      await signIn(primaryProvider, { callbackUrl: "/" })
    } finally {
      setSubmitting(false)
    }
  }, [primaryProvider])

  const handleDeveloperSignIn = useCallback(async () => {
    setSubmitting(true)
    try {
      await signIn("credentials", {
        email: "developer@abode.ai",
        name: "Abode Developer",
        redirect: true,
        callbackUrl: "/",
      })
    } finally {
      setSubmitting(false)
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        onClick={handlePrimarySignIn}
        disabled={isSubmitting}
        className="w-full gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        <span>{isSubmitting ? "Signing in…" : "Sign in with Auth0"}</span>
      </Button>
      {DEV_LOGIN_ENABLED && (
        <Button
          variant="outline"
          onClick={handleDeveloperSignIn}
          disabled={isSubmitting}
          className="w-full gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span>Developer sign-in</span>
        </Button>
      )}
    </div>
  )
}
