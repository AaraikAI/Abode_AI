"use client"

import React, { Suspense, useMemo, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
  ContactShadows,
  TransformControls,
  useGLTF,
} from "@react-three/drei"
import { XR, DefaultXRControllers, Hands } from "@react-three/xr"
import type { Group } from "three"

import type { StudioObject } from "@/types/studio"

interface SceneCanvasProps {
  objects: StudioObject[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  lightingPreset?: "studio" | "sunset" | "dawn" | "warehouse"
  environmentMap?: string | null
  enableXR?: boolean
  allowTransform?: boolean
  transformMode?: "translate" | "rotate" | "scale"
  onTransform?: (id: string, transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void
}

const FLOOR_COLOR = "#e2e8f0"

function BasicGeometry({ assetId }: { assetId: string }) {
  switch (assetId) {
    case "asset-chair":
      return <cylinderGeometry args={[0.35, 0.35, 1.1, 32]} />
    case "asset-tree":
      return <coneGeometry args={[0.7, 1.6, 32]} />
    case "asset-window":
      return <boxGeometry args={[2, 1.4, 0.1]} />
    case "asset-desk":
      return <boxGeometry args={[1.6, 0.75, 0.8]} />
    case "asset-wall":
      return <boxGeometry args={[4, 2.8, 0.2]} />
    case "asset-floor":
      return <planeGeometry args={[20, 20]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

function GLTFAsset({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(), [scene])
  return <primitive object={cloned} />
}

function SceneObjectMesh({
  object,
  isSelected,
  onSelect,
  allowTransform,
  transformMode,
  onTransform,
}: {
  object: StudioObject
  isSelected: boolean
  onSelect: (id: string) => void
  allowTransform: boolean
  transformMode: "translate" | "rotate" | "scale"
  onTransform?: (payload: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void
}) {
  const groupRef = useRef<Group>(null)

  const mesh = (
    <group
      ref={groupRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(object.id)
      }}
    >
      {object.assetId === "asset-floor" ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color={object.color ?? FLOOR_COLOR} opacity={isSelected ? 0.85 : 0.6} transparent />
        </mesh>
      ) : object.gltfUrl ? (
        <GLTFAsset url={object.gltfUrl} />
      ) : (
        <mesh castShadow receiveShadow>
          <BasicGeometry assetId={object.assetId} />
          <meshStandardMaterial
            color={object.material?.color ?? object.color ?? (isSelected ? "#f97316" : "#94a3b8")}
            emissive={object.material?.emissive ?? "#000000"}
            metalness={object.material?.metalness ?? 0.25}
            roughness={object.material?.roughness ?? 0.65}
          />
        </mesh>
      )}
      {isSelected ? (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="#f97316" opacity={0.12} transparent />
        </mesh>
      ) : null}
    </group>
  )

  if (allowTransform && isSelected) {
    return (
      <TransformControls
        mode={transformMode}
        showX
        showY
        showZ
        size={0.95}
        onMouseUp={() => {
          if (!groupRef.current || !onTransform) return
          const position = groupRef.current.position
          const rotation = groupRef.current.rotation
          const scale = groupRef.current.scale
          onTransform({
            position: [position.x, position.y, position.z],
            rotation: [rotation.x, rotation.y, rotation.z],
            scale: [scale.x, scale.y, scale.z],
          })
        }}
      >
        {mesh}
      </TransformControls>
    )
  }

  return mesh
}

function SceneContent({
  objects,
  selectedId,
  onSelect,
  allowTransform,
  transformMode,
  onTransform,
}: Omit<SceneCanvasProps, "lightingPreset" | "environmentMap" | "enableXR"> & { allowTransform: boolean; transformMode: "translate" | "rotate" | "scale" }) {
  return (
    <Suspense fallback={null}>
      <Grid sectionColor="#cbd5f5" cellColor="#e2e8f0" args={[40, 40]} position={[0, -0.01, 0]} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="black" />
      </GizmoHelper>
      {objects.map((object) => (
        <SceneObjectMesh
          key={object.id}
          object={object}
          isSelected={object.id === selectedId}
          allowTransform={allowTransform}
          transformMode={transformMode}
          onTransform={(transform) => onTransform?.(object.id, transform)}
          onSelect={onSelect}
        />
      ))}
    </Suspense>
  )
}

export default function SceneCanvas({
  objects,
  selectedId,
  onSelect,
  lightingPreset = "studio",
  environmentMap,
  enableXR = false,
  allowTransform = true,
  transformMode = "translate",
  onTransform,
}: SceneCanvasProps) {
  const renderer = (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {environmentMap ? (
        <Environment files={environmentMap} background />
      ) : (
        <Environment preset={lightingPreset} />
      )}
      <ContactShadows position={[0, -0.5, 0]} opacity={0.55} width={40} height={40} blur={1.6} far={12} resolution={1024} />
      <SceneContent
        objects={objects}
        selectedId={selectedId}
        onSelect={onSelect}
        allowTransform={allowTransform}
        transformMode={transformMode}
        onTransform={onTransform}
      />
      <OrbitControls makeDefault enablePan enableRotate enableZoom maxPolarAngle={Math.PI / 2.05} />
    </>
  )

  return (
    <Canvas camera={{ position: [6, 6, 6], fov: 50 }} shadows onPointerMissed={() => onSelect(null)}>
      {enableXR ? (
        <XR referenceSpace="local">
          <DefaultXRControllers />
          <Hands />
          {renderer}
        </XR>
      ) : (
        renderer
      )}
    </Canvas>
  )
}

useGLTF.preload?.("/models/window-frame.glb")
useGLTF.preload?.("/models/work-desk.glb")
useGLTF.preload?.("/models/chair.glb")
useGLTF.preload?.("/models/pendant.glb")
