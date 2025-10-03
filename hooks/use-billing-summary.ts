"use client"

import useSWR from "swr"

import { fallbackBillingSummary } from "@/lib/abode-data"
import { fetchBillingSummary } from "@/lib/services/platform"
import type { BillingSummary } from "@/lib/platform-types"

const KEY = "billing/summary"

export function useBillingSummary() {
  const { data, error, isLoading, mutate } = useSWR<BillingSummary>(KEY, fetchBillingSummary, {
    fallbackData: fallbackBillingSummary,
    refreshInterval: 120_000,
  })

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
