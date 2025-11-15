'use client'

import { useEffect, useState, useRef } from 'react'
import { MousePointer2 } from 'lucide-react'

export interface UserCursor {
  userId: string
  userName: string
  x: number
  y: number
  color: string
  lastUpdate: number
}

interface CursorOverlayProps {
  cursors: UserCursor[]
  currentUserId?: string
  showLabels?: boolean
  fadeAfterMs?: number
  smoothTransition?: boolean
}

interface CursorPosition {
  x: number
  y: number
  targetX: number
  targetY: number
}

export function CursorOverlay({
  cursors,
  currentUserId,
  showLabels = true,
  fadeAfterMs = 5000,
  smoothTransition = true,
}: CursorOverlayProps) {
  const [cursorPositions, setCursorPositions] = useState<Map<string, CursorPosition>>(new Map())
  const animationFrameRef = useRef<number>()

  // Smooth cursor animation
  useEffect(() => {
    if (!smoothTransition) return

    const animate = () => {
      setCursorPositions(prev => {
        const updated = new Map(prev)
        let hasChanges = false

        cursors.forEach(cursor => {
          if (cursor.userId === currentUserId) return

          const current = updated.get(cursor.userId)
          if (!current) {
            updated.set(cursor.userId, {
              x: cursor.x,
              y: cursor.y,
              targetX: cursor.x,
              targetY: cursor.y,
            })
            hasChanges = true
          } else {
            // Update target
            if (current.targetX !== cursor.x || current.targetY !== cursor.y) {
              current.targetX = cursor.x
              current.targetY = cursor.y
            }

            // Smooth interpolation
            const dx = current.targetX - current.x
            const dy = current.targetY - current.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance > 0.5) {
              const speed = 0.2
              current.x += dx * speed
              current.y += dy * speed
              hasChanges = true
            } else {
              current.x = current.targetX
              current.y = current.targetY
            }
          }
        })

        return hasChanges ? updated : prev
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [cursors, currentUserId, smoothTransition])

  // Update positions immediately if smooth transition is off
  useEffect(() => {
    if (smoothTransition) return

    setCursorPositions(prev => {
      const updated = new Map(prev)
      cursors.forEach(cursor => {
        if (cursor.userId !== currentUserId) {
          updated.set(cursor.userId, {
            x: cursor.x,
            y: cursor.y,
            targetX: cursor.x,
            targetY: cursor.y,
          })
        }
      })
      return updated
    })
  }, [cursors, currentUserId, smoothTransition])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isRecentlyActive = (lastUpdate: number) => {
    return Date.now() - lastUpdate < fadeAfterMs
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {cursors.map(cursor => {
        if (cursor.userId === currentUserId) return null

        const position = cursorPositions.get(cursor.userId)
        const x = position?.x ?? cursor.x
        const y = position?.y ?? cursor.y
        const isActive = isRecentlyActive(cursor.lastUpdate)
        const opacity = isActive ? 1 : 0.3

        return (
          <div
            key={cursor.userId}
            className={`absolute transition-opacity duration-300`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-2px, -2px)',
              opacity,
              transition: smoothTransition
                ? 'opacity 300ms'
                : 'transform 0.15s ease-out, opacity 300ms',
            }}
          >
            {/* Cursor Icon */}
            <MousePointer2
              className="drop-shadow-lg"
              style={{
                color: cursor.color,
                fill: cursor.color,
                width: '24px',
                height: '24px',
              }}
            />

            {/* User Label */}
            {showLabels && (
              <div
                className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
                style={{
                  backgroundColor: cursor.color,
                }}
              >
                {cursor.userName}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Hook for tracking local cursor position
export function useLocalCursor(
  onCursorMove?: (x: number, y: number) => void,
  throttleMs: number = 50
) {
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastUpdateRef.current < throttleMs) return

      lastUpdateRef.current = now
      onCursorMove?.(e.clientX, e.clientY)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [onCursorMove, throttleMs])
}

// Hook for broadcasting cursor position
export function useCursorBroadcast(
  userId: string,
  userName: string,
  userColor: string,
  onBroadcast?: (cursor: Omit<UserCursor, 'lastUpdate'>) => void
) {
  useLocalCursor((x, y) => {
    onBroadcast?.({
      userId,
      userName,
      x,
      y,
      color: userColor,
    })
  })
}
