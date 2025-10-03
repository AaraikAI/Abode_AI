"use client"

import useSWR from "swr"

import { fallbackPlatformSnapshot } from "@/lib/abode-data"
import { fetchPlatformSnapshot } from "@/lib/services/platform"
import type { PlatformSnapshot } from "@/lib/platform-types"

const PLATFORM_KEY = "platform/snapshot"

const fetcher = async () => fetchPlatformSnapshot()

export function usePlatformSnapshot() {
  const { data, error, isLoading, mutate } = useSWR<PlatformSnapshot>(PLATFORM_KEY, fetcher, {
    fallbackData: fallbackPlatformSnapshot,
    revalidateOnFocus: false,
  })

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
