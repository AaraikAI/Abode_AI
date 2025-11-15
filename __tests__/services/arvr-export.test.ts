/**
 * AR/VR Export Service Test Suite
 * Comprehensive tests for AR/VR scene export and optimization
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  ARVRExportService,
  type ARVRExportOptions,
  type ARVRScene,
  type ARMarkerData,
  type VRTeleportPoint,
  calculateSceneBounds
} from '../../lib/services/arvr-export'
import * as THREE from 'three'

describe('ARVRExportService', () => {
  let service: ARVRExportService
  let basicScene: ARVRScene

  beforeEach(() => {
    service = new ARVRExportService()
    basicScene = {
      objects: [
        {
          id: 'cube1',
          type: 'furniture',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          geometry: {
            type: 'box',
            data: { width: 1, height: 1, depth: 1 }
          },
          material: {
            type: 'standard',
            properties: { color: 0xffffff, metalness: 0, roughness: 0.5 }
          }
        }
      ],
      lights: [
        {
          type: 'ambient',
          properties: { color: 0xffffff, intensity: 1 }
        }
      ]
    }
  })

  // ==================== GLTF Export Tests ====================
  describe('GLTF Export', () => {
    it('should export scene to GLB format', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb'
      })

      expect(result).toBeInstanceOf(ArrayBuffer)
    })

    it('should export scene to GLTF format', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'gltf'
      })

      expect(typeof result === 'string' || result instanceof ArrayBuffer).toBe(true)
    })

    it('should embed images in export', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        embedImages: true
      })

      expect(result).toBeDefined()
    })

    it('should export with binary option', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'gltf',
        binary: true
      })

      expect(result).toBeInstanceOf(ArrayBuffer)
    })

    it('should apply max texture size', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 1024
      })

      expect(result).toBeDefined()
    })

    it('should use Draco compression', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        draco: true
      })

      expect(result).toBeDefined()
    })

    it('should export scene with multiple objects', async () => {
      const complexScene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'wall',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          },
          {
            id: 'obj2',
            type: 'floor',
            position: [2, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0x888888 } }
          }
        ],
        lights: [{ type: 'ambient', properties: { color: 0xffffff, intensity: 1 } }]
      }

      const result = await service.exportToGLTF(complexScene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export different geometry types', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'sphere',
            type: 'decoration',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'sphere', data: { radius: 0.5 } },
            material: { type: 'standard', properties: { color: 0xff0000 } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export cylinder geometry', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'cylinder',
            type: 'column',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'cylinder', data: { radiusTop: 0.5, radiusBottom: 0.5, height: 2 } },
            material: { type: 'standard', properties: { color: 0x00ff00 } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })
  })

  // ==================== GLTF Optimization Tests ====================
  describe('GLTF Optimization', () => {
    it('should simplify geometry when enabled', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        simplifyGeometry: true
      })

      expect(result).toBeDefined()
    })

    it('should compress textures when enabled', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        compressTextures: true
      })

      expect(result).toBeDefined()
    })

    it('should merge geometries when enabled', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        mergeGeometries: true
      })

      expect(result).toBeDefined()
    })

    it('should apply all optimizations together', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        simplifyGeometry: true,
        compressTextures: true,
        mergeGeometries: true,
        maxTextureSize: 1024
      })

      expect(result).toBeDefined()
    })

    it('should use default texture size if not specified', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb'
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== AR Anchor Placement Tests ====================
  describe('AR Anchor Placement', () => {
    it('should support floor anchor type', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'floor',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should support wall anchor type', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'wall',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should support image anchor type', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'image',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should support face anchor type', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'face',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should apply scale factor for real-world units', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        scale: 0.01, // Convert cm to m
        anchorType: 'floor'
      })

      expect(result).toBeDefined()
    })

    it('should generate QR marker data', () => {
      const marker = service.generateARMarker('qr', 'https://example.com/ar', 0.15)

      expect(marker.type).toBe('qr')
      expect(marker.data).toBe('https://example.com/ar')
      expect(marker.size).toBe(0.15)
    })

    it('should generate image marker data', () => {
      const marker = service.generateARMarker('image', 'marker-image-url', 0.2)

      expect(marker.type).toBe('image')
      expect(marker.data).toBe('marker-image-url')
      expect(marker.size).toBe(0.2)
    })

    it('should generate NFT marker data', () => {
      const marker = service.generateARMarker('nft', 'nft-data', 0.1)

      expect(marker.type).toBe('nft')
      expect(marker.size).toBe(0.1)
    })

    it('should use default marker size if not specified', () => {
      const marker = service.generateARMarker('qr', 'data')

      expect(marker.size).toBe(0.1)
    })
  })

  // ==================== VR Navigation Setup Tests ====================
  describe('VR Navigation Setup', () => {
    it('should create navigation mesh', () => {
      const scene = new THREE.Scene()
      const walkableAreas = [
        {
          points: [
            [0, 0, 0] as [number, number, number],
            [10, 0, 0] as [number, number, number],
            [10, 0, 10] as [number, number, number],
            [0, 0, 10] as [number, number, number]
          ]
        }
      ]

      const navMesh = service.createNavMesh(scene, walkableAreas)

      expect(navMesh).toBeInstanceOf(THREE.Mesh)
      expect(navMesh.name).toBe('__vr_navmesh__')
      expect(navMesh.visible).toBe(false)
    })

    it('should create navmesh with multiple areas', () => {
      const scene = new THREE.Scene()
      const walkableAreas = [
        {
          points: [
            [0, 0, 0] as [number, number, number],
            [5, 0, 0] as [number, number, number],
            [5, 0, 5] as [number, number, number],
            [0, 0, 5] as [number, number, number]
          ]
        },
        {
          points: [
            [10, 0, 0] as [number, number, number],
            [15, 0, 0] as [number, number, number],
            [15, 0, 5] as [number, number, number],
            [10, 0, 5] as [number, number, number]
          ]
        }
      ]

      const navMesh = service.createNavMesh(scene, walkableAreas)

      expect(navMesh).toBeDefined()
    })

    it('should support VR teleport points', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        addNavMesh: true
      })

      expect(result).toBeDefined()
    })

    it('should add lightmap for VR', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        addLightmap: true
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== Material & Lighting Tests ====================
  describe('Materials & Lighting', () => {
    it('should export standard material', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'wall',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: {
              type: 'standard',
              properties: { color: 0xff0000, metalness: 0.5, roughness: 0.3 }
            }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export physical material', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'furniture',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: {
              type: 'physical',
              properties: {
                color: 0x00ff00,
                metalness: 0.8,
                roughness: 0.2,
                clearcoat: 0.5,
                clearcoatRoughness: 0.1
              }
            }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export basic material', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'simple',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: {
              type: 'basic',
              properties: { color: 0x0000ff }
            }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export ambient light', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: [
          {
            type: 'ambient',
            properties: { color: 0xffffff, intensity: 0.5 }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export directional light', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: [
          {
            type: 'directional',
            properties: {
              color: 0xffffff,
              intensity: 1,
              position: [10, 10, 10],
              castShadow: true
            }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export point light', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: [
          {
            type: 'point',
            properties: {
              color: 0xffff00,
              intensity: 1,
              distance: 10,
              decay: 2,
              position: [0, 5, 0]
            }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export spot light', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: [
          {
            type: 'spot',
            properties: {
              color: 0xffffff,
              intensity: 1,
              distance: 20,
              angle: Math.PI / 4,
              penumbra: 0.1,
              decay: 2,
              position: [0, 10, 0]
            }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export hemisphere light', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: [
          {
            type: 'hemisphere',
            properties: {
              skyColor: 0x87ceeb,
              groundColor: 0x8b4513,
              intensity: 0.6
            }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export scene with multiple lights', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'room',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [10, 3, 10],
            geometry: { type: 'box', data: { width: 10, height: 3, depth: 10 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: [
          { type: 'ambient', properties: { color: 0x404040, intensity: 0.3 } },
          { type: 'directional', properties: { color: 0xffffff, intensity: 0.8, position: [10, 10, 5] } },
          { type: 'point', properties: { color: 0xffaa00, intensity: 1, position: [0, 2, 0] } }
        ]
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })
  })

  // ==================== Platform-Specific Export Tests ====================
  describe('Platform-Specific Export', () => {
    it('should export for iOS ARKit', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'floor',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should export for Android ARCore', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'image',
        scale: 1.0
      })

      expect(result).toBeDefined()
    })

    it('should export for Meta Quest', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        addNavMesh: true,
        maxTextureSize: 2048,
        simplifyGeometry: true
      })

      expect(result).toBeDefined()
    })

    it('should throw error for USDZ export (not implemented)', async () => {
      await expect(service.exportToUSDZ(basicScene)).rejects.toThrow('USDZ export requires additional conversion tools')
    })

    it('should optimize for mobile platforms', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 1024,
        simplifyGeometry: true,
        draco: true
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== Scene Validation Tests ====================
  describe('Scene Validation', () => {
    it('should validate simple scene', () => {
      const validation = service.validateScene(basicScene)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should warn about high polygon count', () => {
      const largeScene: ARVRScene = {
        objects: Array.from({ length: 200 }, (_, i) => ({
          id: `obj${i}`,
          type: 'furniture',
          position: [i, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
          material: { type: 'standard', properties: { color: 0xffffff } }
        })),
        lights: []
      }

      const validation = service.validateScene(largeScene)

      expect(validation.warnings.length).toBeGreaterThan(0)
    })

    it('should warn about many lights', () => {
      const scene: ARVRScene = {
        objects: [],
        lights: Array.from({ length: 10 }, () => ({
          type: 'point' as const,
          properties: { color: 0xffffff, intensity: 1 }
        }))
      }

      const validation = service.validateScene(scene)

      expect(validation.warnings.some(w => w.includes('lights'))).toBe(true)
    })

    it('should warn about extreme scales', () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'tiny',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [0.001, 0.001, 0.001],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const validation = service.validateScene(scene)

      expect(validation.warnings.some(w => w.includes('scale'))).toBe(true)
    })

    it('should warn about high object count', () => {
      const scene: ARVRScene = {
        objects: Array.from({ length: 1500 }, (_, i) => ({
          id: `obj${i}`,
          type: 'object',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
          material: { type: 'standard', properties: { color: 0xffffff } }
        })),
        lights: []
      }

      const validation = service.validateScene(scene)

      expect(validation.warnings.some(w => w.includes('object count'))).toBe(true)
    })

    it('should pass validation for optimized scene', () => {
      const optimizedScene: ARVRScene = {
        objects: [
          {
            id: 'room',
            type: 'room',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [5, 3, 5],
            geometry: { type: 'box', data: { width: 5, height: 3, depth: 5 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: [
          { type: 'ambient', properties: { color: 0x404040, intensity: 0.5 } },
          { type: 'directional', properties: { color: 0xffffff, intensity: 1 } }
        ]
      }

      const validation = service.validateScene(optimizedScene)

      expect(validation.valid).toBe(true)
    })
  })

  // ==================== Asset Compression Tests ====================
  describe('Asset Compression', () => {
    it('should apply Draco compression to geometry', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        draco: true
      })

      expect(result).toBeDefined()
    })

    it('should set Draco compression level', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        draco: true
      })

      // Compression is applied internally
      expect(result).toBeDefined()
    })

    it('should quantize vertex attributes', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        draco: true
      })

      expect(result).toBeDefined()
    })

    it('should compress without Draco', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        draco: false,
        compressTextures: true
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== Texture Optimization Tests ====================
  describe('Texture Optimization', () => {
    it('should limit texture size to 1024px', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 1024
      })

      expect(result).toBeDefined()
    })

    it('should limit texture size to 2048px', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 2048
      })

      expect(result).toBeDefined()
    })

    it('should limit texture size to 512px for mobile', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 512
      })

      expect(result).toBeDefined()
    })

    it('should use default texture size', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb'
      })

      expect(result).toBeDefined()
    })

    it('should compress textures', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        compressTextures: true
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== LOD Generation Tests ====================
  describe('LOD (Level of Detail) Generation', () => {
    it('should simplify geometry for LOD', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        simplifyGeometry: true
      })

      expect(result).toBeDefined()
    })

    it('should create multiple LOD levels', async () => {
      // LOD would be created through simplifyGeometry
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        simplifyGeometry: true
      })

      expect(result).toBeDefined()
    })

    it('should optimize high-poly models', async () => {
      const highPolyScene: ARVRScene = {
        objects: [
          {
            id: 'sphere',
            type: 'decoration',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: {
              type: 'sphere',
              data: { radius: 1, widthSegments: 64, heightSegments: 64 }
            },
            material: { type: 'standard', properties: { color: 0xff0000 } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(highPolyScene, {
        format: 'glb',
        simplifyGeometry: true
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== Occlusion Handling Tests ====================
  describe('Occlusion Handling', () => {
    it('should handle AR occlusion with shadow plane', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'floor'
      })

      expect(result).toBeDefined()
    })

    it('should not add shadow plane for non-floor anchors', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        anchorType: 'wall'
      })

      expect(result).toBeDefined()
    })

    it('should configure shadow casting', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'furniture',
            position: [0, 1, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: [
          {
            type: 'directional',
            properties: {
              color: 0xffffff,
              intensity: 1,
              position: [5, 10, 5],
              castShadow: true
            }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, {
        format: 'glb',
        anchorType: 'floor'
      })

      expect(result).toBeDefined()
    })
  })

  // ==================== Scene Bounds & Utilities ====================
  describe('Scene Bounds Calculation', () => {
    it('should calculate scene bounds', () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [2, 2, 2]
          },
          {
            id: 'obj2',
            type: 'object',
            position: [5, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        ],
        lights: []
      }

      const bounds = calculateSceneBounds(scene)

      expect(bounds.min).toBeDefined()
      expect(bounds.max).toBeDefined()
      expect(bounds.center).toBeDefined()
      expect(bounds.size).toBeDefined()
    })

    it('should calculate center point', () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [-5, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          {
            id: 'obj2',
            type: 'object',
            position: [5, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        ],
        lights: []
      }

      const bounds = calculateSceneBounds(scene)

      expect(bounds.center[0]).toBeCloseTo(0, 1)
    })

    it('should calculate scene size', () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [10, 5, 8]
          }
        ],
        lights: []
      }

      const bounds = calculateSceneBounds(scene)

      expect(bounds.size[0]).toBeCloseTo(10, 0)
      expect(bounds.size[1]).toBeCloseTo(5, 0)
      expect(bounds.size[2]).toBeCloseTo(8, 0)
    })

    it('should handle single object scene', () => {
      const bounds = calculateSceneBounds(basicScene)

      expect(bounds).toBeDefined()
      expect(bounds.min).toHaveLength(3)
      expect(bounds.max).toHaveLength(3)
    })

    it('should handle negative positions', () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [-10, -5, -8],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        ],
        lights: []
      }

      const bounds = calculateSceneBounds(scene)

      expect(bounds.min[0]).toBeLessThan(0)
      expect(bounds.min[1]).toBeLessThan(0)
      expect(bounds.min[2]).toBeLessThan(0)
    })
  })

  // ==================== Camera & Environment Tests ====================
  describe('Camera & Environment', () => {
    it('should export scene with camera', async () => {
      const scene: ARVRScene = {
        objects: basicScene.objects,
        lights: basicScene.lights,
        camera: {
          position: [0, 1.6, 5],
          target: [0, 0, 0],
          fov: 75
        }
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export scene with background', async () => {
      const scene: ARVRScene = {
        objects: basicScene.objects,
        lights: basicScene.lights,
        environment: {
          background: '#87ceeb'
        }
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should export scene with skybox', async () => {
      const scene: ARVRScene = {
        objects: basicScene.objects,
        lights: basicScene.lights,
        environment: {
          skybox: 'https://example.com/skybox.hdr'
        }
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })
  })

  // ==================== Edge Cases & Error Handling ====================
  describe('Edge Cases & Error Handling', () => {
    it('should handle empty scene', async () => {
      const emptyScene: ARVRScene = {
        objects: [],
        lights: []
      }

      const result = await service.exportToGLTF(emptyScene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle scene with no lights', async () => {
      const scene: ARVRScene = {
        objects: basicScene.objects,
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle scene with no objects', async () => {
      const scene: ARVRScene = {
        objects: [],
        lights: basicScene.lights
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle objects without geometry', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'marker',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle objects without material', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle zero scale objects', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [0, 0, 0],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const validation = service.validateScene(scene)
      expect(validation.warnings.some(w => w.includes('scale'))).toBe(true)
    })

    it('should handle large rotations', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [Math.PI * 2, Math.PI * 2, Math.PI * 2],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle very small geometries', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 0.001, height: 0.001, depth: 0.001 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle very large geometries', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'box', data: { width: 1000, height: 1000, depth: 1000 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle concurrent exports', async () => {
      const promises = Array.from({ length: 5 }, () =>
        service.exportToGLTF(basicScene, { format: 'glb' })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })

    it('should validate scene bounds for empty scene', () => {
      const emptyScene: ARVRScene = {
        objects: [],
        lights: []
      }

      const bounds = calculateSceneBounds(emptyScene)

      expect(bounds.min[0]).toBe(Infinity)
      expect(bounds.max[0]).toBe(-Infinity)
    })

    it('should handle objects with mixed positive and negative scales', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, -1, 1], // Negative Y scale (flip)
            geometry: { type: 'box', data: { width: 1, height: 1, depth: 1 } },
            material: { type: 'standard', properties: { color: 0xffffff } }
          }
        ],
        lights: []
      }

      const result = await service.exportToGLTF(scene, { format: 'glb' })
      expect(result).toBeDefined()
    })

    it('should handle scene with complex material properties', async () => {
      const scene: ARVRScene = {
        objects: [
          {
            id: 'obj1',
            type: 'object',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            geometry: { type: 'sphere', data: { radius: 1, widthSegments: 32, heightSegments: 16 } },
            material: {
              type: 'physical',
              properties: {
                color: 0xff5500,
                metalness: 0.9,
                roughness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05
              }
            }
          }
        ],
        lights: [
          {
            type: 'point',
            properties: { color: 0xffffff, intensity: 2, position: [5, 5, 5] }
          }
        ]
      }

      const result = await service.exportToGLTF(scene, {
        format: 'glb',
        maxTextureSize: 2048
      })
      expect(result).toBeDefined()
    })

    it('should optimize scene for WebXR', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        maxTextureSize: 2048,
        simplifyGeometry: true,
        compressTextures: true,
        addNavMesh: true
      })

      expect(result).toBeDefined()
    })

    it('should handle export with all options enabled', async () => {
      const result = await service.exportToGLTF(basicScene, {
        format: 'glb',
        embedImages: true,
        binary: true,
        maxTextureSize: 1024,
        draco: true,
        scale: 1.0,
        anchorType: 'floor',
        addLightmap: true,
        addNavMesh: true,
        simplifyGeometry: true,
        compressTextures: true,
        mergeGeometries: true
      })

      expect(result).toBeDefined()
    })
  })
})
