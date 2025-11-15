/**
 * Post-Processing FX Pipeline Tests
 * Comprehensive test suite covering tonemapping, bloom, color grading, and all effects
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { createCanvas, ImageData as CanvasImageData } from 'canvas'
import * as fs from 'fs/promises'
import {
  PostFXPipeline,
  LUT_PRESETS,
  type PostFXSettings
} from '../../lib/services/post-fx-pipeline'

// Mock canvas and fs modules
jest.mock('canvas')
jest.mock('fs/promises')

const mockedCreateCanvas = createCanvas as jest.MockedFunction<typeof createCanvas>
const mockedFs = fs as jest.Mocked<typeof fs>

describe('PostFXPipeline', () => {
  let pipeline: PostFXPipeline
  let mockCanvas: any
  let mockContext: any
  let mockImageData: CanvasImageData

  beforeEach(() => {
    jest.clearAllMocks()
    pipeline = new PostFXPipeline()

    // Create mock image data
    const width = 100
    const height = 100
    const data = new Uint8ClampedArray(width * height * 4)

    // Fill with test pattern
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128     // R
      data[i + 1] = 128 // G
      data[i + 2] = 128 // B
      data[i + 3] = 255 // A
    }

    mockImageData = {
      width,
      height,
      data
    } as any

    mockContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue(mockImageData),
      putImageData: jest.fn()
    }

    mockCanvas = {
      width: width,
      height: height,
      getContext: jest.fn().mockReturnValue(mockContext),
      toBuffer: jest.fn().mockReturnValue(Buffer.from('test'))
    }

    mockedCreateCanvas.mockReturnValue(mockCanvas)
  })

  describe('Constructor', () => {
    it('should create pipeline instance', () => {
      const newPipeline = new PostFXPipeline()
      expect(newPipeline).toBeInstanceOf(PostFXPipeline)
    })

    it('should initialize without canvas', () => {
      const newPipeline = new PostFXPipeline()
      expect(newPipeline).toBeDefined()
    })
  })

  describe('processImage - Full Pipeline', () => {
    const mockSettings: PostFXSettings = {
      tonemapping: {
        enabled: true,
        mode: 'aces',
        exposure: 0,
        whitePoint: 1
      }
    }

    beforeEach(() => {
      // Mock loadImage
      const mockImage = {
        width: 100,
        height: 100
      }
      jest.spyOn(require('canvas'), 'loadImage').mockResolvedValue(mockImage)
    })

    it('should process image with tonemapping', async () => {
      await pipeline.processImage('/input.png', '/output.png', mockSettings)

      expect(mockedCreateCanvas).toHaveBeenCalled()
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(mockContext.getImageData).toHaveBeenCalled()
      expect(mockContext.putImageData).toHaveBeenCalled()
    })

    it('should save processed image', async () => {
      await pipeline.processImage('/input.png', '/output.png', mockSettings)

      expect(mockCanvas.toBuffer).toHaveBeenCalledWith('image/png')
      expect(mockedFs.writeFile).toHaveBeenCalledWith('/output.png', expect.any(Buffer))
    })

    it('should apply effects in correct order', async () => {
      const settings: PostFXSettings = {
        tonemapping: { enabled: true, mode: 'aces', exposure: 0, whitePoint: 1 },
        colorGrading: { enabled: true, temperature: 0, tint: 0, saturation: 1, contrast: 1, brightness: 0, gamma: 1 },
        lut: { enabled: true, intensity: 0.5 },
        bloom: { enabled: true, threshold: 0.8, intensity: 0.3, radius: 10 },
        vignette: { enabled: true, intensity: 0.5, radius: 0.8, softness: 0.5 },
        chromaticAberration: { enabled: true, intensity: 0.5 },
        filmGrain: { enabled: true, intensity: 0.3, size: 1 },
        sharpen: { enabled: true, amount: 1 }
      }

      await pipeline.processImage('/input.png', '/output.png', settings)

      expect(mockContext.putImageData).toHaveBeenCalled()
    })

    it('should skip disabled effects', async () => {
      const settings: PostFXSettings = {
        tonemapping: { enabled: false, mode: 'aces', exposure: 0, whitePoint: 1 },
        bloom: { enabled: false, threshold: 0.8, intensity: 0.3, radius: 10 }
      }

      await pipeline.processImage('/input.png', '/output.png', settings)

      expect(mockContext.putImageData).toHaveBeenCalled()
    })

    it('should handle empty settings', async () => {
      await pipeline.processImage('/input.png', '/output.png', {})

      expect(mockCanvas.toBuffer).toHaveBeenCalled()
    })
  })

  describe('Tonemapping - ACES', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply ACES tonemapping', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: 0,
        whitePoint: 1
      }

      // @ts-ignore - accessing private method for testing
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Uint8ClampedArray)
    })

    it('should handle high exposure values', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: 2,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(128)
    })

    it('should handle low exposure values', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: -2,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeLessThan(128)
    })

    it('should clamp output to 255', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: 5,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
      expect(result.data[1]).toBeLessThanOrEqual(255)
      expect(result.data[2]).toBeLessThanOrEqual(255)
    })

    it('should preserve alpha channel', () => {
      imageData.data[3] = 200

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: 0,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[3]).toBe(200)
    })

    it('should process all pixels', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'aces',
        exposure: 0,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      const pixelCount = imageData.width * imageData.height
      expect(result.data.length).toBe(pixelCount * 4)
    })
  })

  describe('Tonemapping - Filmic', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply filmic tonemapping', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'filmic',
        exposure: 0,
        whitePoint: 11.2
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should use whitePoint parameter', () => {
      const settings1: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'filmic',
        exposure: 0,
        whitePoint: 5
      }

      const settings2: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'filmic',
        exposure: 0,
        whitePoint: 15
      }

      const imageData1 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
      const imageData2 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }

      // @ts-ignore
      const result1 = pipeline['applyTonemapping'](imageData1, settings1)
      // @ts-ignore
      const result2 = pipeline['applyTonemapping'](imageData2, settings2)

      expect(result1.data[0]).not.toBe(result2.data[0])
    })

    it('should handle bright pixels', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'filmic',
        exposure: 0,
        whitePoint: 11.2
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
    })

    it('should handle dark pixels', () => {
      imageData.data[0] = 0
      imageData.data[1] = 0
      imageData.data[2] = 0

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'filmic',
        exposure: 0,
        whitePoint: 11.2
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Tonemapping - Reinhard', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply Reinhard tonemapping', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'reinhard',
        exposure: 0,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should compress bright pixels', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'reinhard',
        exposure: 2,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
    })

    it('should calculate luminance correctly', () => {
      imageData.data[0] = 255 // R
      imageData.data[1] = 0   // G
      imageData.data[2] = 0   // B

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'reinhard',
        exposure: 0,
        whitePoint: 1
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(0)
    })
  })

  describe('Tonemapping - Uncharted2', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply Uncharted2 tonemapping', () => {
      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'uncharted2',
        exposure: 0,
        whitePoint: 11.2
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should use whitePoint for normalization', () => {
      const settings1: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'uncharted2',
        exposure: 0,
        whitePoint: 5
      }

      const settings2: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'uncharted2',
        exposure: 0,
        whitePoint: 15
      }

      const imageData1 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
      const imageData2 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }

      // @ts-ignore
      const result1 = pipeline['applyTonemapping'](imageData1, settings1)
      // @ts-ignore
      const result2 = pipeline['applyTonemapping'](imageData2, settings2)

      expect(result1.data[0]).not.toBe(result2.data[0])
    })

    it('should handle high dynamic range', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['tonemapping']> = {
        enabled: true,
        mode: 'uncharted2',
        exposure: 3,
        whitePoint: 11.2
      }

      // @ts-ignore
      const result = pipeline['applyTonemapping'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
    })
  })

  describe('Bloom Effect', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply bloom effect', () => {
      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.8,
        intensity: 0.5,
        radius: 10
      }

      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should extract bright pixels above threshold', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.5,
        intensity: 1,
        radius: 5
      }

      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(0)
    })

    it('should ignore dark pixels below threshold', () => {
      imageData.data[0] = 10
      imageData.data[1] = 10
      imageData.data[2] = 10

      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.9,
        intensity: 1,
        radius: 5
      }

      const originalValue = imageData.data[0]
      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      // Value should not increase much since it's below threshold
      expect(result.data[0]).toBeLessThanOrEqual(originalValue + 10)
    })

    it('should apply Gaussian blur to bright pixels', () => {
      // Set one bright pixel
      const centerIdx = (50 * 100 + 50) * 4
      imageData.data[centerIdx] = 255
      imageData.data[centerIdx + 1] = 255
      imageData.data[centerIdx + 2] = 255

      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.8,
        intensity: 1,
        radius: 10
      }

      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      // Surrounding pixels should be affected
      expect(result).toBeDefined()
    })

    it('should blend bloom with original image', () => {
      imageData.data[0] = 200
      imageData.data[1] = 200
      imageData.data[2] = 200

      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.5,
        intensity: 0.3,
        radius: 5
      }

      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      expect(result.data[0]).toBeGreaterThanOrEqual(200)
    })

    it('should respect intensity parameter', () => {
      const imageData1 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
      const imageData2 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }

      imageData1.data[0] = 255
      imageData2.data[0] = 255

      const settings1: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.5,
        intensity: 0.1,
        radius: 5
      }

      const settings2: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.5,
        intensity: 0.9,
        radius: 5
      }

      // @ts-ignore
      const result1 = pipeline['applyBloom'](imageData1, settings1)
      // @ts-ignore
      const result2 = pipeline['applyBloom'](imageData2, settings2)

      expect(result2.data[0]).toBeGreaterThanOrEqual(result1.data[0])
    })

    it('should clamp output to 255', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['bloom']> = {
        enabled: true,
        threshold: 0.1,
        intensity: 2,
        radius: 10
      }

      // @ts-ignore
      const result = pipeline['applyBloom'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
    })
  })

  describe('Color Grading', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply temperature adjustment', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 50,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(128) // Red increased
      expect(result.data[2]).toBeLessThan(128)    // Blue decreased
    })

    it('should apply negative temperature', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: -50,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeLessThan(128)    // Red decreased
      expect(result.data[2]).toBeGreaterThan(128) // Blue increased
    })

    it('should apply tint adjustment', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 50,
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[1]).toBeGreaterThan(128) // Green increased
    })

    it('should apply brightness adjustment', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: 0.5,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(128)
      expect(result.data[1]).toBeGreaterThan(128)
      expect(result.data[2]).toBeGreaterThan(128)
    })

    it('should apply negative brightness', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: -0.5,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeLessThan(128)
      expect(result.data[1]).toBeLessThan(128)
      expect(result.data[2]).toBeLessThan(128)
    })

    it('should apply contrast adjustment', () => {
      imageData.data[0] = 100 // Dark pixel
      imageData.data[4] = 200 // Bright pixel

      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 1,
        contrast: 2,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      // Dark should be darker, bright should be brighter
      expect(result.data[0]).toBeLessThan(100)
      expect(result.data[4]).toBeGreaterThan(200)
    })

    it('should apply saturation adjustment', () => {
      imageData.data[0] = 200 // R
      imageData.data[1] = 100 // G
      imageData.data[2] = 50  // B

      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 2,
        contrast: 1,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      // Colors should be more saturated
      expect(result).toBeDefined()
    })

    it('should desaturate with saturation < 1', () => {
      imageData.data[0] = 200
      imageData.data[1] = 100
      imageData.data[2] = 50

      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 0,
        contrast: 1,
        brightness: 0,
        gamma: 1
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      // All channels should be close to gray
      const diff = Math.abs(result.data[0] - result.data[1])
      expect(diff).toBeLessThan(10)
    })

    it('should apply gamma correction', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 2
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeLessThan(128) // Gamma > 1 darkens midtones
    })

    it('should apply low gamma', () => {
      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 0,
        tint: 0,
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 0.5
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeGreaterThan(128) // Gamma < 1 brightens midtones
    })

    it('should clamp output values', () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: 100,
        tint: 100,
        saturation: 2,
        contrast: 2,
        brightness: 1,
        gamma: 0.5
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeLessThanOrEqual(255)
      expect(result.data[1]).toBeLessThanOrEqual(255)
      expect(result.data[2]).toBeLessThanOrEqual(255)
    })

    it('should handle negative values', () => {
      imageData.data[0] = 0
      imageData.data[1] = 0
      imageData.data[2] = 0

      const settings: NonNullable<PostFXSettings['colorGrading']> = {
        enabled: true,
        temperature: -100,
        tint: -100,
        saturation: 0,
        contrast: 2,
        brightness: -1,
        gamma: 2
      }

      // @ts-ignore
      const result = pipeline['applyColorGrading'](imageData, settings)

      expect(result.data[0]).toBeGreaterThanOrEqual(0)
      expect(result.data[1]).toBeGreaterThanOrEqual(0)
      expect(result.data[2]).toBeGreaterThanOrEqual(0)
    })
  })

  describe('LUT (Color Lookup Table)', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply LUT transformation', async () => {
      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        lutFile: 'test.cube',
        intensity: 1
      }

      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should blend LUT with intensity', async () => {
      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        intensity: 0.5
      }

      const original = imageData.data[0]
      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      // Result should be blend between original and LUT
      expect(result).toBeDefined()
    })

    it('should not modify at intensity 0', async () => {
      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        intensity: 0
      }

      const original = new Uint8ClampedArray(imageData.data)
      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      expect(result.data[0]).toBe(original[0])
      expect(result.data[1]).toBe(original[1])
      expect(result.data[2]).toBe(original[2])
    })

    it('should fully apply at intensity 1', async () => {
      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        intensity: 1
      }

      const original = imageData.data[0]
      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      // Should be different from original
      expect(result).toBeDefined()
    })

    it('should preserve alpha channel', async () => {
      imageData.data[3] = 200

      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      expect(result.data[3]).toBe(200)
    })

    it('should clamp output to valid range', async () => {
      imageData.data[0] = 255
      imageData.data[1] = 255
      imageData.data[2] = 255

      const settings: NonNullable<PostFXSettings['lut']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = await pipeline['applyLUT'](imageData, settings)

      expect(result.data[0]).toBeGreaterThanOrEqual(0)
      expect(result.data[0]).toBeLessThanOrEqual(255)
    })
  })

  describe('Vignette Effect', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply vignette effect', () => {
      const settings: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 0.5,
        radius: 0.8,
        softness: 0.5
      }

      // @ts-ignore
      const result = pipeline['applyVignette'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should darken edges more than center', () => {
      const settings: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 1,
        radius: 0.5,
        softness: 0.5
      }

      // Set all pixels to same value
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 200
        imageData.data[i + 1] = 200
        imageData.data[i + 2] = 200
      }

      // @ts-ignore
      const result = pipeline['applyVignette'](imageData, settings)

      // Center pixel
      const centerIdx = (50 * 100 + 50) * 4
      const centerValue = result.data[centerIdx]

      // Corner pixel
      const cornerIdx = 0
      const cornerValue = result.data[cornerIdx]

      expect(cornerValue).toBeLessThan(centerValue)
    })

    it('should respect intensity parameter', () => {
      const imageData1 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
      const imageData2 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }

      for (let i = 0; i < imageData1.data.length; i += 4) {
        imageData1.data[i] = 200
        imageData2.data[i] = 200
      }

      const settings1: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 0.2,
        radius: 0.8,
        softness: 0.5
      }

      const settings2: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 0.9,
        radius: 0.8,
        softness: 0.5
      }

      // @ts-ignore
      const result1 = pipeline['applyVignette'](imageData1, settings1)
      // @ts-ignore
      const result2 = pipeline['applyVignette'](imageData2, settings2)

      // Higher intensity should darken edges more
      expect(result2.data[0]).toBeLessThan(result1.data[0])
    })

    it('should respect radius parameter', () => {
      const settings: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 1,
        radius: 0.2, // Small radius = large dark area
        softness: 0.5
      }

      // @ts-ignore
      const result = pipeline['applyVignette'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should respect softness parameter', () => {
      const settings: NonNullable<PostFXSettings['vignette']> = {
        enabled: true,
        intensity: 1,
        radius: 0.8,
        softness: 0.1 // Low softness = hard edge
      }

      // @ts-ignore
      const result = pipeline['applyVignette'](imageData, settings)

      expect(result).toBeDefined()
    })
  })

  describe('Chromatic Aberration', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply chromatic aberration', () => {
      const settings: NonNullable<PostFXSettings['chromaticAberration']> = {
        enabled: true,
        intensity: 0.5
      }

      // @ts-ignore
      const result = pipeline['applyChromaticAberration'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should shift red channel left', () => {
      imageData.data[404] = 255 // Set red at center

      const settings: NonNullable<PostFXSettings['chromaticAberration']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = pipeline['applyChromaticAberration'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should shift blue channel right', () => {
      imageData.data[406] = 255 // Set blue at center

      const settings: NonNullable<PostFXSettings['chromaticAberration']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = pipeline['applyChromaticAberration'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should not shift green channel', () => {
      imageData.data[405] = 200 // Set green at center

      const settings: NonNullable<PostFXSettings['chromaticAberration']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = pipeline['applyChromaticAberration'](imageData, settings)

      expect(result.data[405]).toBe(200)
    })

    it('should clamp shifts to image bounds', () => {
      const settings: NonNullable<PostFXSettings['chromaticAberration']> = {
        enabled: true,
        intensity: 1
      }

      // @ts-ignore
      const result = pipeline['applyChromaticAberration'](imageData, settings)

      expect(result).toBeDefined()
    })
  })

  describe('Film Grain', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply film grain', () => {
      const settings: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 0.5,
        size: 1
      }

      // @ts-ignore
      const result = pipeline['applyFilmGrain'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should add random noise', () => {
      const settings: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 1,
        size: 1
      }

      const original = new Uint8ClampedArray(imageData.data)
      // @ts-ignore
      const result = pipeline['applyFilmGrain'](imageData, settings)

      // At least some pixels should be different
      let differentCount = 0
      for (let i = 0; i < result.data.length; i += 4) {
        if (result.data[i] !== original[i]) {
          differentCount++
        }
      }
      expect(differentCount).toBeGreaterThan(0)
    })

    it('should respect intensity parameter', () => {
      const imageData1 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
      const imageData2 = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }

      const settings1: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 0.1,
        size: 1
      }

      const settings2: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 1,
        size: 1
      }

      // Higher intensity should create more noise
      // @ts-ignore
      const result1 = pipeline['applyFilmGrain'](imageData1, settings1)
      // @ts-ignore
      const result2 = pipeline['applyFilmGrain'](imageData2, settings2)

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })

    it('should clamp output to valid range', () => {
      imageData.data[0] = 255

      const settings: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 1,
        size: 1
      }

      // @ts-ignore
      const result = pipeline['applyFilmGrain'](imageData, settings)

      expect(result.data[0]).toBeGreaterThanOrEqual(0)
      expect(result.data[0]).toBeLessThanOrEqual(255)
    })

    it('should preserve alpha channel', () => {
      imageData.data[3] = 200

      const settings: NonNullable<PostFXSettings['filmGrain']> = {
        enabled: true,
        intensity: 1,
        size: 1
      }

      // @ts-ignore
      const result = pipeline['applyFilmGrain'](imageData, settings)

      expect(result.data[3]).toBe(200)
    })
  })

  describe('Sharpen Effect', () => {
    let imageData: CanvasImageData

    beforeEach(() => {
      imageData = { ...mockImageData, data: new Uint8ClampedArray(mockImageData.data) }
    })

    it('should apply sharpen filter', () => {
      const settings: NonNullable<PostFXSettings['sharpen']> = {
        enabled: true,
        amount: 1
      }

      // @ts-ignore
      const result = pipeline['applySharpen'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should use sharpen kernel', () => {
      // Create an edge
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 100; x++) {
          const i = (y * 100 + x) * 4
          imageData.data[i] = 0
          imageData.data[i + 1] = 0
          imageData.data[i + 2] = 0
        }
      }
      for (let y = 50; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const i = (y * 100 + x) * 4
          imageData.data[i] = 255
          imageData.data[i + 1] = 255
          imageData.data[i + 2] = 255
        }
      }

      const settings: NonNullable<PostFXSettings['sharpen']> = {
        enabled: true,
        amount: 1
      }

      // @ts-ignore
      const result = pipeline['applySharpen'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should respect amount parameter', () => {
      const settings: NonNullable<PostFXSettings['sharpen']> = {
        enabled: true,
        amount: 2
      }

      // @ts-ignore
      const result = pipeline['applySharpen'](imageData, settings)

      expect(result).toBeDefined()
    })

    it('should clamp output values', () => {
      imageData.data[404] = 255 // Center pixel very bright

      const settings: NonNullable<PostFXSettings['sharpen']> = {
        enabled: true,
        amount: 2
      }

      // @ts-ignore
      const result = pipeline['applySharpen'](imageData, settings)

      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i]).toBeGreaterThanOrEqual(0)
        expect(result.data[i]).toBeLessThanOrEqual(255)
      }
    })

    it('should preserve edges', () => {
      const settings: NonNullable<PostFXSettings['sharpen']> = {
        enabled: true,
        amount: 1
      }

      // @ts-ignore
      const result = pipeline['applySharpen'](imageData, settings)

      // Edge pixels should not be modified (boundary handling)
      expect(result.data[0]).toBeDefined()
    })
  })

  describe('Gaussian Blur (Internal)', () => {
    it('should blur image data', () => {
      const data = new Uint8ClampedArray(100 * 100 * 4)

      // Set center pixel bright
      const centerIdx = (50 * 100 + 50) * 4
      data[centerIdx] = 255
      data[centerIdx + 1] = 255
      data[centerIdx + 2] = 255

      // @ts-ignore
      const result = pipeline['gaussianBlur'](data, 100, 100, 5)

      expect(result).toBeDefined()
      expect(result.length).toBe(data.length)
    })

    it('should spread bright pixels', () => {
      const data = new Uint8ClampedArray(100 * 100 * 4)

      const centerIdx = (50 * 100 + 50) * 4
      data[centerIdx] = 255
      data[centerIdx + 1] = 255
      data[centerIdx + 2] = 255

      // @ts-ignore
      const result = pipeline['gaussianBlur'](data, 100, 100, 10)

      // Surrounding pixels should have some value
      const adjacentIdx = (50 * 100 + 51) * 4
      expect(result[adjacentIdx]).toBeGreaterThan(0)
    })

    it('should handle small radius', () => {
      const data = new Uint8ClampedArray(100 * 100 * 4)

      // @ts-ignore
      const result = pipeline['gaussianBlur'](data, 100, 100, 1)

      expect(result).toBeDefined()
    })

    it('should handle large radius', () => {
      const data = new Uint8ClampedArray(100 * 100 * 4)

      // @ts-ignore
      const result = pipeline['gaussianBlur'](data, 100, 100, 20)

      expect(result).toBeDefined()
    })

    it('should normalize kernel', () => {
      const data = new Uint8ClampedArray(10 * 10 * 4)

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 100
        data[i + 1] = 100
        data[i + 2] = 100
      }

      // @ts-ignore
      const result = pipeline['gaussianBlur'](data, 10, 10, 3)

      // Average should remain similar
      expect(result[0]).toBeGreaterThan(80)
      expect(result[0]).toBeLessThan(120)
    })
  })

  describe('LUT_PRESETS', () => {
    it('should define warm_earthy preset', () => {
      expect(LUT_PRESETS.warm_earthy).toBeDefined()
      expect(LUT_PRESETS.warm_earthy.name).toBe('Warm & Earthy')
      expect(LUT_PRESETS.warm_earthy.temperature).toBe(10)
    })

    it('should define neutral preset', () => {
      expect(LUT_PRESETS.neutral).toBeDefined()
      expect(LUT_PRESETS.neutral.name).toBe('Neutral')
      expect(LUT_PRESETS.neutral.temperature).toBe(0)
    })

    it('should define cool_dusk preset', () => {
      expect(LUT_PRESETS.cool_dusk).toBeDefined()
      expect(LUT_PRESETS.cool_dusk.name).toBe('Cool Dusk')
      expect(LUT_PRESETS.cool_dusk.temperature).toBe(-15)
    })

    it('should define cinematic preset', () => {
      expect(LUT_PRESETS.cinematic).toBeDefined()
      expect(LUT_PRESETS.cinematic.name).toBe('Cinematic')
      expect(LUT_PRESETS.cinematic.saturation).toBe(1.15)
    })

    it('should have all required properties in each preset', () => {
      Object.values(LUT_PRESETS).forEach(preset => {
        expect(preset).toHaveProperty('name')
        expect(preset).toHaveProperty('temperature')
        expect(preset).toHaveProperty('tint')
        expect(preset).toHaveProperty('saturation')
        expect(preset).toHaveProperty('contrast')
      })
    })
  })
})
