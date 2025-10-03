import type { Namespace, Server, Socket } from "socket.io"

import type { CollaborationWorkspace } from "@/lib/data/collaboration"
import {
  addAnnotation,
  listApprovalQueue,
  listAnnotations,
  upsertApprovalItem,
  type ApprovalItemRecord,
} from "@/lib/data/collaboration"
import type { DagRun } from "@/lib/data/dag-runs"
import { getDagRun } from "@/lib/data/dag-runs"

type CursorState = {
  userId: string
  userName: string
  color: string
  x: number
  y: number
  workspace: CollaborationWorkspace
  targetId?: string
  updatedAt: number
}

type ApprovalStatus = "queued" | "in_review" | "approved" | "rejected"

interface RoomState {
  cursors: Map<string, CursorState>
  clients: Set<string>
}

const rooms = new Map<string, RoomState>()
let collabNamespace: Namespace | null = null

function getRoom(roomId: string): RoomState {
  let room = rooms.get(roomId)
  if (!room) {
    room = { cursors: new Map(), clients: new Set() }
    rooms.set(roomId, room)
  }
  return room
}

function randomCursorColor() {
  const palette = ["#2563eb", "#16a34a", "#db2777", "#f97316", "#8b5cf6", "#0ea5e9"]
  return palette[Math.floor(Math.random() * palette.length)]
}

function resolveRoomId(orgId: string, workspace: string, targetId?: string | null) {
  return `${orgId}:${workspace}${targetId ? `:${targetId}` : ""}`
}

async function loadOrchestrationSnapshot(orgId: string, runId?: string | null) {
  if (!runId) return null
  const run = getDagRun(runId)
  if (!run || run.orgId !== orgId) return null
  return run
}

export function registerCollaborationNamespace(io: Server) {
  if (io._nsps.has("/collab")) {
    collabNamespace = io.of("/collab")
    return collabNamespace
  }

  const namespace = io.of("/collab")
  collabNamespace = namespace

  namespace.on("connection", (socket: Socket) => {
    const { orgId, workspace = "design-studio", targetId } = socket.handshake.query as Record<string, string>
    const userId = (socket.handshake.query.userId as string | undefined) ?? socket.id
    const userName = (socket.handshake.query.userName as string | undefined) ?? "Guest"

    if (!orgId) {
      socket.disconnect(true)
      return
    }

    const roomId = resolveRoomId(orgId, workspace, targetId)
    socket.join(roomId)

    const room = getRoom(roomId)
    room.clients.add(socket.id)

    const cursorColor = randomCursorColor()

    // hydrate annotations, approvals, and orchestration snapshot (if applicable)
    void (async () => {
      try {
        const [annotations, approvalQueue, orchestrationRun] = await Promise.all([
          listAnnotations({ orgId, workspace: workspace as CollaborationWorkspace, targetId }),
          listApprovalQueue({ orgId, queueKey: `${workspace}:${targetId ?? "global"}` }),
          workspace === "orchestration" ? loadOrchestrationSnapshot(orgId, targetId) : Promise.resolve(null),
        ])

        socket.emit("collab:init", {
          cursors: Array.from(room.cursors.values()),
          annotations,
          approvals: approvalQueue,
          run: orchestrationRun,
        })
      } catch (error) {
        socket.emit("collab:error", { message: (error as Error).message })
      }
    })()

    socket.on("cursor:update", (payload: { x: number; y: number }) => {
      const cursor: CursorState = {
        userId,
        userName,
        color: cursorColor,
        x: payload.x,
        y: payload.y,
        workspace: workspace as CollaborationWorkspace,
        targetId,
        updatedAt: Date.now(),
      }
      room.cursors.set(userId, cursor)
      socket.to(roomId).emit("cursor:state", cursor)
    })

    socket.on("annotation:add", async (payload: { body: string; position?: Record<string, unknown> }) => {
      try {
        const record = await addAnnotation({
          orgId,
          workspace: workspace as CollaborationWorkspace,
          targetId,
          authorId: userId,
          authorName: userName,
          body: payload.body,
          position: payload.position,
        })
        namespace.to(roomId).emit("annotation:added", record)
      } catch (error) {
        socket.emit("collab:error", { message: (error as Error).message })
      }
    })

    socket.on(
      "approval:transition",
      async (payload: { itemId: string; status: ApprovalStatus; metadata?: Record<string, unknown> }) => {
        try {
          const record = await upsertApprovalItem({
            orgId,
            queueKey: `${workspace}:${targetId ?? "global"}`,
            itemId: payload.itemId,
            status: payload.status,
            payload: payload.metadata,
            requestedBy: userId,
            resolvedBy: payload.status === "approved" || payload.status === "rejected" ? userId : null,
            resolvedAt:
              payload.status === "approved" || payload.status === "rejected" ? new Date().toISOString() : null,
          })
          broadcastApprovalUpdateInternal(namespace, orgId, workspace, targetId, record)
        } catch (error) {
          socket.emit("collab:error", { message: (error as Error).message })
        }
      }
    )

    socket.on("disconnect", () => {
      room.clients.delete(socket.id)
      room.cursors.delete(userId)
      socket.to(roomId).emit("cursor:leave", { userId })

      if (room.clients.size === 0) {
        rooms.delete(roomId)
      }
    })
  })

  return namespace
}

function broadcastApprovalUpdateInternal(
  namespace: Namespace,
  orgId: string,
  workspace: string,
  targetId: string | undefined | null,
  record: ApprovalItemRecord
) {
  const roomId = resolveRoomId(orgId, workspace, targetId)
  namespace.to(roomId).emit("approval:updated", record)
  namespace.to(resolveRoomId(orgId, workspace)).emit("approval:updated", record)
}

export function broadcastApprovalUpdate(
  orgId: string,
  workspace: CollaborationWorkspace,
  targetId: string | undefined | null,
  record: ApprovalItemRecord
) {
  if (!collabNamespace) return
  broadcastApprovalUpdateInternal(collabNamespace, orgId, workspace, targetId, record)
}

export function broadcastOrchestrationRun(run: DagRun) {
  if (!collabNamespace) return
  const payload = { run }
  collabNamespace.to(resolveRoomId(run.orgId, "orchestration", run.id)).emit("orchestration:run", payload)
  collabNamespace.to(resolveRoomId(run.orgId, "orchestration")).emit("orchestration:run", payload)
}
