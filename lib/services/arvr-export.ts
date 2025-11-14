/**
 * AR/VR Export Service
 *
 * Exports scenes to GLTF/GLB format for AR/VR experiences
 * Supports WebXR, ARCore, ARKit, Meta Quest, HTC Vive
 */

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { DRACOExporter } from 'three/examples/jsm/exporters/DRACOExporter'

export interface ARVRExportOptions {
  format: 'gltf' | 'glb'
  embedImages?: boolean
  binary?: boolean
  maxTextureSize?: number
  draco?: boolean
  // AR-specific
  scale?: number // Scale factor for real-world units (meters)
  anchorType?: 'floor' | 'wall' | 'image' | 'face'
  // VR-specific
  addLightmap?: boolean
  addNavMesh?: boolean
  // Optimization
  simplifyGeometry?: boolean
  compressTextures?: boolean
  mergeGeometries?: boolean
}

export interface ARVRScene {
  objects: Array<{
    id: string
    type: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    geometry?: {
      type: 'box' | 'sphere' | 'cylinder' | 'mesh'
      data: any
    }
    material?: {
      type: 'standard' | 'physical' | 'basic'
      properties: any
    }
  }>
  lights: Array<{
    type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere'
    properties: any
  }>
  camera?: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  environment?: {
    background?: string
    skybox?: string
  }
}

export interface ARMarkerData {
  type: 'qr' | 'image' | 'nft'
  data: string
  size?: number // Physical size in meters
}

export interface VRTeleportPoint {
  position: [number, number, number]
  rotation: [number, number, number]
  label: string
}

export class ARVRExportService {
  private scene: THREE.Scene
  private gltfExporter: GLTFExporter
  private dracoExporter: DRACOExporter | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.gltfExporter = new GLTFExporter()
  }

  /**
   * Convert scene data to THREE.js scene
   */
  private buildThreeScene(sceneData: ARVRScene): THREE.Scene {
    const scene = new THREE.Scene()

    // Add objects
    sceneData.objects.forEach(obj => {
      let geometry: THREE.BufferGeometry

      switch (obj.geometry?.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(
            obj.geometry.data.width || 1,
            obj.geometry.data.height || 1,
            obj.geometry.data.depth || 1
          )
          break
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            obj.geometry.data.radius || 0.5,
            obj.geometry.data.widthSegments || 32,
            obj.geometry.data.heightSegments || 16
          )
          break
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            obj.geometry.data.radiusTop || 0.5,
            obj.geometry.data.radiusBottom || 0.5,
            obj.geometry.data.height || 1,
            obj.geometry.data.radialSegments || 32
          )
          break
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1)
      }

      let material: THREE.Material

      switch (obj.material?.type) {
        case 'physical':
          material = new THREE.MeshPhysicalMaterial({
            color: obj.material.properties.color || 0xffffff,
            metalness: obj.material.properties.metalness || 0,
            roughness: obj.material.properties.roughness || 0.5,
            clearcoat: obj.material.properties.clearcoat || 0,
            clearcoatRoughness: obj.material.properties.clearcoatRoughness || 0
          })
          break
        case 'standard':
          material = new THREE.MeshStandardMaterial({
            color: obj.material.properties.color || 0xffffff,
            metalness: obj.material.properties.metalness || 0,
            roughness: obj.material.properties.roughness || 0.5
          })
          break
        default:
          material = new THREE.MeshBasicMaterial({
            color: obj.material?.properties?.color || 0xffffff
          })
      }

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...obj.position)
      mesh.rotation.set(...obj.rotation)
      mesh.scale.set(...obj.scale)
      mesh.name = obj.id
      mesh.userData = { type: obj.type }

      scene.add(mesh)
    })

    // Add lights
    sceneData.lights.forEach(light => {
      let lightObj: THREE.Light

      switch (light.type) {
        case 'ambient':
          lightObj = new THREE.AmbientLight(
            light.properties.color || 0xffffff,
            light.properties.intensity || 1
          )
          break
        case 'directional':
          lightObj = new THREE.DirectionalLight(
            light.properties.color || 0xffffff,
            light.properties.intensity || 1
          )
          if (light.properties.position) {
            lightObj.position.set(...light.properties.position)
          }
          if (light.properties.castShadow) {
            lightObj.castShadow = true
          }
          break
        case 'point':
          lightObj = new THREE.PointLight(
            light.properties.color || 0xffffff,
            light.properties.intensity || 1,
            light.properties.distance || 0,
            light.properties.decay || 2
          )
          if (light.properties.position) {
            lightObj.position.set(...light.properties.position)
          }
          break
        case 'spot':
          lightObj = new THREE.SpotLight(
            light.properties.color || 0xffffff,
            light.properties.intensity || 1,
            light.properties.distance || 0,
            light.properties.angle || Math.PI / 3,
            light.properties.penumbra || 0,
            light.properties.decay || 2
          )
          if (light.properties.position) {
            lightObj.position.set(...light.properties.position)
          }
          break
        case 'hemisphere':
          lightObj = new THREE.HemisphereLight(
            light.properties.skyColor || 0xffffff,
            light.properties.groundColor || 0x444444,
            light.properties.intensity || 1
          )
          break
        default:
          lightObj = new THREE.AmbientLight(0xffffff, 1)
      }

      scene.add(lightObj)
    })

    return scene
  }

  /**
   * Optimize scene for AR/VR
   */
  private optimizeScene(scene: THREE.Scene, options: ARVRExportOptions): THREE.Scene {
    if (options.mergeGeometries) {
      // Merge similar geometries to reduce draw calls
      const geometries: THREE.BufferGeometry[] = []
      const materials: THREE.Material[] = []

      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          geometries.push(obj.geometry)
          materials.push(obj.material as THREE.Material)
        }
      })

      // Group by material and merge
      // (Simplified - production would need more sophisticated merging)
    }

    if (options.simplifyGeometry) {
      // Reduce polygon count for performance
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          // Use SimplifyModifier or similar
          // (Would need to implement or use three/examples/jsm/modifiers/SimplifyModifier)
        }
      })
    }

    if (options.maxTextureSize) {
      // Downscale textures
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          const material = obj.material as THREE.MeshStandardMaterial
          if (material.map) {
            const texture = material.map
            if (texture.image && (texture.image.width > options.maxTextureSize! || texture.image.height > options.maxTextureSize!)) {
              // Resize texture (would use canvas or sharp in Node.js)
            }
          }
        }
      })
    }

    return scene
  }

  /**
   * Add AR-specific metadata
   */
  private addARMetadata(scene: THREE.Scene, options: ARVRExportOptions): void {
    scene.userData.ar = {
      scale: options.scale || 1.0,
      anchorType: options.anchorType || 'floor',
      isARCompatible: true
    }

    // Add AR shadow plane for floor anchor
    if (options.anchorType === 'floor') {
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.ShadowMaterial({ opacity: 0.5 })
      )
      shadowPlane.rotation.x = -Math.PI / 2
      shadowPlane.receiveShadow = true
      shadowPlane.name = '__ar_shadow_plane__'
      scene.add(shadowPlane)
    }
  }

  /**
   * Add VR-specific features
   */
  private addVRFeatures(scene: THREE.Scene, teleportPoints?: VRTeleportPoint[]): void {
    scene.userData.vr = {
      isVRCompatible: true,
      teleportPoints: teleportPoints || []
    }

    // Add VR controller models (simplified)
    // Production would include proper controller meshes

    // Add teleport markers
    if (teleportPoints) {
      teleportPoints.forEach(point => {
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
          new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
        )
        marker.position.set(...point.position)
        marker.rotation.set(...point.rotation)
        marker.name = `__vr_teleport_${point.label}__`
        marker.userData = { teleportLabel: point.label }
        scene.add(marker)
      })
    }
  }

  /**
   * Export scene to GLTF/GLB
   */
  async exportToGLTF(
    sceneData: ARVRScene,
    options: ARVRExportOptions = { format: 'glb' }
  ): Promise<ArrayBuffer | string> {
    return new Promise((resolve, reject) => {
      try {
        // Build THREE.js scene
        let scene = this.buildThreeScene(sceneData)

        // Optimize for AR/VR
        scene = this.optimizeScene(scene, options)

        // Add platform-specific metadata
        this.addARMetadata(scene, options)

        // Configure exporter options
        const exporterOptions = {
          binary: options.format === 'glb' || options.binary,
          embedImages: options.embedImages !== false,
          maxTextureSize: options.maxTextureSize || 2048,
          ...(options.draco && {
            dracoOptions: {
              compressionLevel: 7,
              quantizationBits: {
                POSITION: 14,
                NORMAL: 10,
                COLOR: 8,
                TEX_COORD: 12,
                GENERIC: 12
              }
            }
          })
        }

        // Export
        this.gltfExporter.parse(
          scene,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(result)
            } else {
              // JSON string
              resolve(options.format === 'glb' ? new TextEncoder().encode(JSON.stringify(result)).buffer : JSON.stringify(result, null, 2))
            }
          },
          (error) => {
            reject(new Error(`GLTF export failed: ${error.message}`))
          },
          exporterOptions
        )
      } catch (error: any) {
        reject(new Error(`Failed to export scene: ${error.message}`))
      }
    })
  }

  /**
   * Generate AR marker/anchor data
   */
  generateARMarker(type: 'qr' | 'image' | 'nft', data: string, size?: number): ARMarkerData {
    return {
      type,
      data,
      size: size || 0.1 // Default 10cm
    }
  }

  /**
   * Create VR navigation mesh
   */
  createNavMesh(scene: THREE.Scene, walkableAreas: Array<{ points: [number, number, number][] }>): THREE.Mesh {
    // Simplified navigation mesh creation
    // Production would use pathfinding libraries like recast-navigation

    const navMeshGeometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    walkableAreas.forEach(area => {
      const startIndex = vertices.length / 3
      area.points.forEach(point => {
        vertices.push(...point)
      })

      // Create triangles (simplified - assumes convex polygons)
      for (let i = 1; i < area.points.length - 1; i++) {
        indices.push(startIndex, startIndex + i, startIndex + i + 1)
      }
    })

    navMeshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    navMeshGeometry.setIndex(indices)
    navMeshGeometry.computeVertexNormals()

    const navMesh = new THREE.Mesh(
      navMeshGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      })
    )
    navMesh.name = '__vr_navmesh__'
    navMesh.visible = false // Hidden by default, used for pathfinding

    return navMesh
  }

  /**
   * Validate scene for AR/VR compatibility
   */
  validateScene(sceneData: ARVRScene): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []

    // Check polygon count
    let totalTriangles = 0
    sceneData.objects.forEach(obj => {
      if (obj.geometry?.type === 'mesh') {
        // Estimate triangle count
        totalTriangles += 1000 // Placeholder
      } else {
        totalTriangles += 12 // Cube has 12 triangles
      }
    })

    if (totalTriangles > 100000) {
      warnings.push(`High polygon count: ${totalTriangles} triangles. Consider simplifying geometry.`)
    }

    if (totalTriangles > 500000) {
      errors.push(`Polygon count too high: ${totalTriangles} triangles. Maximum recommended: 500,000.`)
    }

    // Check object count
    if (sceneData.objects.length > 1000) {
      warnings.push(`High object count: ${sceneData.objects.length} objects. Consider merging geometries.`)
    }

    // Check for lights (important for VR performance)
    if (sceneData.lights.length > 8) {
      warnings.push(`Many lights: ${sceneData.lights.length}. Real-time rendering may be slow. Consider baking lightmaps.`)
    }

    // Check scale (AR)
    const hasExtremeScales = sceneData.objects.some(obj => {
      const maxScale = Math.max(...obj.scale)
      const minScale = Math.min(...obj.scale)
      return maxScale > 100 || minScale < 0.01
    })

    if (hasExtremeScales) {
      warnings.push('Some objects have extreme scale values. This may cause AR tracking issues.')
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    }
  }

  /**
   * Create AR quick look file (USDZ) for iOS
   * Note: This requires additional conversion tools
   */
  async exportToUSDZ(sceneData: ARVRScene): Promise<ArrayBuffer> {
    // USDZ export would require additional tools like USD Python bindings
    // or conversion from GLTF to USDZ via external service
    // This is a placeholder for the interface
    throw new Error('USDZ export requires additional conversion tools. Use GLTF export and convert externally.')
  }
}

// Helper function to calculate scene bounds
export function calculateSceneBounds(sceneData: ARVRScene): {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
} {
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  sceneData.objects.forEach(obj => {
    const [x, y, z] = obj.position
    const [sx, sy, sz] = obj.scale

    minX = Math.min(minX, x - sx / 2)
    minY = Math.min(minY, y - sy / 2)
    minZ = Math.min(minZ, z - sz / 2)

    maxX = Math.max(maxX, x + sx / 2)
    maxY = Math.max(maxY, y + sy / 2)
    maxZ = Math.max(maxZ, z + sz / 2)
  })

  const center: [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  ]

  const size: [number, number, number] = [
    maxX - minX,
    maxY - minY,
    maxZ - minZ
  ]

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center,
    size
  }
}
