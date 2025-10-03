import type { NextApiRequest } from "next"
import type { NextApiResponseServerIO } from "@/types/socket"

import { registerCollaborationNamespace } from "@/lib/collaboration/hub"

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const { Server } = await import("socket.io")
    const io = new Server(res.socket.server, {
      path: "/api/collab/socket",
      cors: {
        origin: "*",
      },
    })
    res.socket.server.io = io
    registerCollaborationNamespace(io)
  }

  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}
