import type { ComponentType } from "react"

declare module "@react-three/fiber" {
  export const Canvas: ComponentType<any>
  export type ThreeEvent<TEvent> = TEvent
}

declare module "@react-three/drei" {
  export const OrbitControls: ComponentType<any>
  export const Grid: ComponentType<any>
  export const GizmoHelper: ComponentType<any>
  export const GizmoViewport: ComponentType<any>
}
