/**
 * Skip Link Component
 *
 * Provides keyboard users ability to skip navigation and jump to main content
 * WCAG 2.1 Technique G1: Adding a link at the top of each page
 */

'use client'

import { useEffect, useRef } from 'react'

interface SkipLinkProps {
  targetId: string
  text?: string
  className?: string
}

export function SkipLink({ targetId, text = 'Skip to main content', className = '' }: SkipLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.setAttribute('tabindex', '-1')
        target.focus()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }

    const link = linkRef.current
    if (link) {
      link.addEventListener('click', handleClick as any)
      return () => link.removeEventListener('click', handleClick as any)
    }
  }, [targetId])

  return (
    <a
      ref={linkRef}
      href={`#${targetId}`}
      className={`skip-link ${className}`}
      style={{
        position: 'absolute',
        top: '-100%',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--color-primary, #0066cc)',
        color: '#ffffff',
        padding: '0.75rem 1.5rem',
        textDecoration: 'none',
        borderRadius: '0 0 0.25rem 0.25rem',
        fontWeight: 500,
        zIndex: 9999,
        transition: 'top 0.3s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100%'
      }}
    >
      {text}
    </a>
  )
}
