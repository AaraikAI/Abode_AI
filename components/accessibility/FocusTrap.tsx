/**
 * Focus Trap Component
 *
 * Traps keyboard focus within a container for modal dialogs and overlays
 * WCAG 2.1 Success Criterion 2.1.2: No Keyboard Trap (except when intentional)
 */

'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { accessibility } from '@/lib/services/accessibility'

interface FocusTrapProps {
  children: ReactNode
  active?: boolean
  initialFocus?: string
  returnFocus?: boolean
  escapeDeactivates?: boolean
  onDeactivate?: () => void
  className?: string
}

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
  escapeDeactivates = true,
  onDeactivate,
  className = ''
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const cleanup = accessibility.setupFocusTrap(containerRef.current, {
      initialFocus,
      returnFocus,
      escapeDeactivates
    })

    cleanupRef.current = cleanup

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeDeactivates) {
        cleanup()
        onDeactivate?.()
      }
    }

    if (escapeDeactivates) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      cleanup()
      if (escapeDeactivates) {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [active, initialFocus, returnFocus, escapeDeactivates, onDeactivate])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
