"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

import { config } from "@/lib/config"
import type { TelemetryEvent } from "@/lib/platform-types"

export function useRealtimeTelemetry(enabled = true) {
  const [events, setEvents] = useState<TelemetryEvent[]>([])

  useEffect(() => {
    if (!enabled || !config.socketUrl) {
      return
    }

    const socket: Socket = io(config.socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    })

    const handleEvent = (event: TelemetryEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 20))
    }

    socket.on("telemetry", handleEvent)

    return () => {
      socket.off("telemetry", handleEvent)
      socket.disconnect()
    }
  }, [enabled])

  return { events }
}
