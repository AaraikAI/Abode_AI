/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers
 * WCAG 2.1 Technique C7: Using CSS to hide a portion of the link text
 */

import { ReactNode, HTMLAttributes } from 'react'

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  focusable?: boolean
}

export function VisuallyHidden({ children, focusable = false, ...props }: VisuallyHiddenProps) {
  return (
    <span
      {...props}
      className={`visually-hidden ${props.className || ''}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        ...(focusable && {
          clip: 'auto',
          height: 'auto',
          overflow: 'visible',
          position: 'static',
          whiteSpace: 'normal',
          width: 'auto'
        }),
        ...props.style
      }}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
    </span>
  )
}
