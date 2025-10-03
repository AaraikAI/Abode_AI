"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

import type { AnnotationRecord, ApprovalItemRecord } from "@/lib/data/collaboration"
import type { DagRun } from "@/lib/data/dag-runs"

export interface CollaborationOptions {
  orgId: string
  workspace: string
  targetId?: string
  userId?: string
  userName?: string
}

export interface RemoteCursorState {
  userId: string
  userName: string
  color: string
  x: number
  y: number
}

interface InitPayload {
  cursors: RemoteCursorState[]
  annotations: AnnotationRecord[]
  approvals: ApprovalItemRecord[]
  run?: DagRun | null
}

export function useCollaboration(options: CollaborationOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [cursors, setCursors] = useState<RemoteCursorState[]>([])
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([])
  const [approvals, setApprovals] = useState<ApprovalItemRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<DagRun | null>(null)

  const sortedApprovals = useMemo(() => {
    return [...approvals].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [approvals])

  useEffect(() => {
    const url = `${window.location.origin}/api/collab/socket`
    const socket = io(url, {
      path: "/api/collab/socket",
      transports: ["websocket"],
      query: {
        orgId: options.orgId,
        workspace: options.workspace,
        targetId: options.targetId ?? "",
        userId: options.userId ?? "",
        userName: options.userName ?? "",
      },
    })

    socketRef.current = socket

    socket.on("connect_error", (err) => setError(err.message))
    socket.on("disconnect", () => setCursors([]))
    socket.on("collab:error", (payload: { message: string }) => setError(payload.message))

    socket.on("collab:init", (payload: InitPayload) => {
      setCursors(payload.cursors)
      setAnnotations(payload.annotations)
      setApprovals(payload.approvals)
      if (payload.run) {
        setRun(payload.run)
      }
    })

    socket.on("cursor:state", (cursor: RemoteCursorState) => {
      setCursors((prev) => {
        const next = prev.filter((item) => item.userId !== cursor.userId)
        next.push(cursor)
        return next
      })
    })

    socket.on("cursor:leave", ({ userId }: { userId: string }) => {
      setCursors((prev) => prev.filter((cursor) => cursor.userId !== userId))
    })

    socket.on("annotation:added", (annotation: AnnotationRecord) => {
      setAnnotations((prev) => [annotation, ...prev])
    })

    socket.on("approval:updated", (record: ApprovalItemRecord) => {
      setApprovals((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === record.id)
        if (existingIndex === -1) {
          return [...prev, record]
        }
        const clone = [...prev]
        clone[existingIndex] = record
        return clone
      })
    })

    socket.on("orchestration:run", ({ run: incoming }: { run: DagRun }) => {
      setRun(incoming)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [options.orgId, options.workspace, options.targetId, options.userId, options.userName])

  const emitCursor = useCallback((pos: { x: number; y: number }) => {
    socketRef.current?.emit("cursor:update", pos)
  }, [])

  const addAnnotation = useCallback((body: string, position?: Record<string, unknown>) => {
    socketRef.current?.emit("annotation:add", { body, position })
  }, [])

  const transitionApproval = useCallback(
    (itemId: string, status: ApprovalItemRecord["status"], metadata?: Record<string, unknown>) => {
      socketRef.current?.emit("approval:transition", { itemId, status, metadata })
    },
    []
  )

  return {
    cursors,
    annotations,
    approvals: sortedApprovals,
    run,
    error,
    emitCursor,
    addAnnotation,
    transitionApproval,
  }
}
