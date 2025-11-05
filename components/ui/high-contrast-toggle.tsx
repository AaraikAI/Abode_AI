"use client"

import { useEffect, useState } from "react"
import { SunMoon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function HighContrastToggle() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("abodeai:high-contrast")
    if (stored) {
      const isEnabled = stored === "true"
      setEnabled(isEnabled)
      if (isEnabled) {
        document.documentElement.classList.add("high-contrast")
      }
    }
    const handler = () => {
      toggle()
    }
    document.addEventListener("abodeai:toggle-contrast", handler)
    return () => document.removeEventListener("abodeai:toggle-contrast", handler)
  }, [])

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add("high-contrast")
      } else {
        document.documentElement.classList.remove("high-contrast")
      }
      localStorage.setItem("abodeai:high-contrast", String(next))
      return next
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1" aria-pressed={enabled} aria-label="Toggle high contrast mode">
      <SunMoon className="h-4 w-4" />
      <span className="text-xs">High contrast</span>
    </Button>
  )
}
