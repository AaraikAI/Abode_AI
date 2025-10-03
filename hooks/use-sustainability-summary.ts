"use client"

import useSWR from "swr"

import { fallbackSustainabilitySummary } from "@/lib/abode-data"
import { fetchSustainabilitySummary } from "@/lib/services/platform"
import type { SustainabilitySummary } from "@/lib/platform-types"

const KEY = "metrics/sustainability"

export function useSustainabilitySummary() {
  const { data, error, isLoading, mutate } = useSWR<SustainabilitySummary>(KEY, fetchSustainabilitySummary, {
    fallbackData: fallbackSustainabilitySummary,
    refreshInterval: 60_000,
  })

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
