const PRIVATE_IP_PREFIXES = [/^::1$/, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^fc00:/, /^fe80:/]

function sanitizeIp(ip?: string | null): string | null {
  if (!ip) return null
  const cleaned = ip.replace(/^::ffff:/, "").trim()
  if (!cleaned) return null
  return cleaned
}

export function deriveGeoCountry(params: {
  ipAddress?: string | null
  headerCountry?: string | null
  defaultCountry?: string | null
}): string | null {
  const header = params.headerCountry?.trim()
  if (header) {
    return header.toUpperCase()
  }

  const ip = sanitizeIp(params.ipAddress)
  if (ip) {
    const isPrivate = PRIVATE_IP_PREFIXES.some((pattern) => pattern.test(ip))
    if (!isPrivate) {
      // TODO: plug in MaxMind/GeoIP provider. For now return placeholder to avoid nulls.
      return params.defaultCountry?.toUpperCase() ?? null
    }
  }

  if (params.defaultCountry) {
    return params.defaultCountry.toUpperCase()
  }

  return null
}

export function normalizeIp(ip?: string | null): string | null {
  return sanitizeIp(ip)
}
