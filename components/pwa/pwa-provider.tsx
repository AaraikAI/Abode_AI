"use client"

import { useEffect, useState } from "react"

import { requestNotificationPermission } from "@/lib/pwa/firebase"

const VOICE_COMMANDS = {
  "open analytics": () => window.location.assign("/analytics"),
  "open integrations": () => window.location.assign("/integrations"),
  "toggle contrast": () => document.dispatchEvent(new CustomEvent("abodeai:toggle-contrast")),
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [voiceSupported, setVoiceSupported] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((error) => console.warn("Service worker registration failed", error))
    }
  }, [])

  useEffect(() => {
    requestNotificationPermission().catch((error) => console.warn("Notification permission failed", error))
  }, [])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
      const handler = VOICE_COMMANDS[transcript as keyof typeof VOICE_COMMANDS]
      if (handler) {
        handler()
      }
    }
    recognition.onerror = () => {
      setVoiceSupported(false)
    }
    recognition.onend = () => {
      if (voiceSupported) {
        recognition.start()
      }
    }

    setVoiceSupported(true)
    recognition.start()

    return () => {
      setVoiceSupported(false)
      recognition.stop()
    }
  }, [voiceSupported])

  return <>{children}</>
}
