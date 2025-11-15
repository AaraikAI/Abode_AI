/**
 * Live Region Component
 *
 * Announces dynamic content changes to screen readers
 * WCAG 2.1 Success Criterion 4.1.3: Status Messages
 */

'use client'

import { useEffect, useRef } from 'react'

interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  clearOnUnmount?: boolean
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export function LiveRegion({
  message,
  priority = 'polite',
  clearOnUnmount = true,
  atomic = true,
  relevant = 'additions text'
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!regionRef.current) return

    // Clear and set message with delay to ensure screen readers announce
    regionRef.current.textContent = ''
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message
      }
    }, 100)

    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = ''
      }
    }
  }, [message, clearOnUnmount])

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="visually-hidden"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    />
  )
}
