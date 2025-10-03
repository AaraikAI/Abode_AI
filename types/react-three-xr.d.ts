declare module "@react-three/xr" {
  import type { FC, ReactNode } from "react"

  export interface XRProps {
    children?: ReactNode
    referenceSpace?: "viewer" | "local" | "local-floor" | "bounded-floor" | "unbounded"
  }

  export const XR: FC<XRProps>

  export const DefaultXRControllers: FC
  export const Hands: FC
}
