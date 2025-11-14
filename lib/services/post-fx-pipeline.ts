/**
 * Post-Processing FX Pipeline
 *
 * Advanced post-processing effects for rendered images:
 * - LUT (Color Lookup Tables)
 * - Bloom
 * - Tonemapping (Filmic, ACES, Reinhard)
 * - Vignette
 * - Chromatic Aberration
 * - Film Grain
 * - Color Grading
 * - Sharpen
 * - Depth of Field
 */

import { createCanvas, loadImage, ImageData } from 'canvas'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface PostFXSettings {
  lut?: {
    enabled: boolean
    lutFile?: string  // Path to 3D LUT file
    intensity: number // 0-1
  }
  bloom?: {
    enabled: boolean
    threshold: number // 0-1
    intensity: number // 0-1
    radius: number // pixels
  }
  tonemapping?: {
    enabled: boolean
    mode: 'filmic' | 'aces' | 'reinhard' | 'uncharted2'
    exposure: number // -5 to 5
    whitePoint: number
  }
  colorGrading?: {
    enabled: boolean
    temperature: number // -100 to 100
    tint: number // -100 to 100
    saturation: number // 0-2
    contrast: number // 0-2
    brightness: number // -1 to 1
    gamma: number // 0.1-3
  }
  vignette?: {
    enabled: boolean
    intensity: number // 0-1
    radius: number // 0-1
    softness: number // 0-1
  }
  chromaticAberration?: {
    enabled: boolean
    intensity: number // 0-1
  }
  filmGrain?: {
    enabled: boolean
    intensity: number // 0-1
    size: number // pixels
  }
  sharpen?: {
    enabled: boolean
    amount: number // 0-2
  }
  depthOfField?: {
    enabled: boolean
    focalDistance: number
    aperture: number
    blurAmount: number
  }
}

export class PostFXPipeline {
  private canvas: any
  private ctx: any

  constructor() {}

  async processImage(
    inputPath: string,
    outputPath: string,
    settings: PostFXSettings
  ): Promise<void> {
    // Load image
    const image = await loadImage(inputPath)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    // Draw original image
    ctx.drawImage(image, 0, 0)
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Apply effects in order
    if (settings.tonemapping?.enabled) {
      imageData = this.applyTonemapping(imageData, settings.tonemapping)
    }

    if (settings.colorGrading?.enabled) {
      imageData = this.applyColorGrading(imageData, settings.colorGrading)
    }

    if (settings.lut?.enabled) {
      imageData = await this.applyLUT(imageData, settings.lut)
    }

    if (settings.bloom?.enabled) {
      imageData = this.applyBloom(imageData, settings.bloom)
    }

    if (settings.vignette?.enabled) {
      imageData = this.applyVignette(imageData, settings.vignette)
    }

    if (settings.chromaticAberration?.enabled) {
      imageData = this.applyChromaticAberration(imageData, settings.chromaticAberration)
    }

    if (settings.filmGrain?.enabled) {
      imageData = this.applyFilmGrain(imageData, settings.filmGrain)
    }

    if (settings.sharpen?.enabled) {
      imageData = this.applySharpen(imageData, settings.sharpen)
    }

    // Put processed image back
    ctx.putImageData(imageData, 0, 0)

    // Save output
    const buffer = canvas.toBuffer('image/png')
    await fs.writeFile(outputPath, buffer)
  }

  private applyTonemapping(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['tonemapping']>
  ): ImageData {
    const data = imageData.data
    const exposure = Math.pow(2, settings.exposure)

    for (let i = 0; i < data.length; i += 4) {
      let r = (data[i] / 255) * exposure
      let g = (data[i + 1] / 255) * exposure
      let b = (data[i + 2] / 255) * exposure

      // Apply tonemapping operator
      switch (settings.mode) {
        case 'filmic':
          [r, g, b] = this.filmicTonemap(r, g, b, settings.whitePoint)
          break
        case 'aces':
          [r, g, b] = this.acesTonemap(r, g, b)
          break
        case 'reinhard':
          [r, g, b] = this.reinhardTonemap(r, g, b)
          break
        case 'uncharted2':
          [r, g, b] = this.uncharted2Tonemap(r, g, b, settings.whitePoint)
          break
      }

      data[i] = Math.min(255, r * 255)
      data[i + 1] = Math.min(255, g * 255)
      data[i + 2] = Math.min(255, b * 255)
    }

    return imageData
  }

  private filmicTonemap(r: number, g: number, b: number, whitePoint: number): [number, number, number] {
    const tonemap = (x: number) => {
      const a = 2.51
      const b = 0.03
      const c = 2.43
      const d = 0.59
      const e = 0.14
      return Math.max(0, (x * (a * x + b)) / (x * (c * x + d) + e))
    }

    return [
      tonemap(r / whitePoint),
      tonemap(g / whitePoint),
      tonemap(b / whitePoint)
    ]
  }

  private acesTonemap(r: number, g: number, b: number): [number, number, number] {
    const tonemap = (x: number) => {
      const a = 2.51
      const b = 0.03
      const c = 2.43
      const d = 0.59
      const e = 0.14
      return (x * (a * x + b)) / (x * (c * x + d) + e)
    }

    // RRT and ODT fit
    const rrt = (x: number) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081)

    return [
      Math.max(0, Math.min(1, rrt(r))),
      Math.max(0, Math.min(1, rrt(g))),
      Math.max(0, Math.min(1, rrt(b)))
    ]
  }

  private reinhardTonemap(r: number, g: number, b: number): [number, number, number] {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const scale = lum / (1 + lum)
    return [
      r * scale / lum,
      g * scale / lum,
      b * scale / lum
    ]
  }

  private uncharted2Tonemap(r: number, g: number, b: number, whitePoint: number): [number, number, number] {
    const tonemap = (x: number) => {
      const A = 0.15
      const B = 0.50
      const C = 0.10
      const D = 0.20
      const E = 0.02
      const F = 0.30
      return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F
    }

    const curr = [tonemap(r), tonemap(g), tonemap(b)]
    const white = tonemap(whitePoint)

    return [curr[0] / white, curr[1] / white, curr[2] / white]
  }

  private applyColorGrading(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['colorGrading']>
  ): ImageData {
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255
      let g = data[i + 1] / 255
      let b = data[i + 2] / 255

      // Temperature
      if (settings.temperature !== 0) {
        const temp = settings.temperature / 100
        r += temp
        b -= temp
      }

      // Tint
      if (settings.tint !== 0) {
        const tint = settings.tint / 100
        g += tint
      }

      // Brightness
      r += settings.brightness
      g += settings.brightness
      b += settings.brightness

      // Contrast
      r = (r - 0.5) * settings.contrast + 0.5
      g = (g - 0.5) * settings.contrast + 0.5
      b = (b - 0.5) * settings.contrast + 0.5

      // Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
      r = gray + (r - gray) * settings.saturation
      g = gray + (g - gray) * settings.saturation
      b = gray + (b - gray) * settings.saturation

      // Gamma
      r = Math.pow(Math.max(0, r), 1 / settings.gamma)
      g = Math.pow(Math.max(0, g), 1 / settings.gamma)
      b = Math.pow(Math.max(0, b), 1 / settings.gamma)

      // Clamp
      data[i] = Math.max(0, Math.min(255, r * 255))
      data[i + 1] = Math.max(0, Math.min(255, g * 255))
      data[i + 2] = Math.max(0, Math.min(255, b * 255))
    }

    return imageData
  }

  private async applyLUT(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['lut']>
  ): Promise<ImageData> {
    // Load 3D LUT file (cube format)
    // Simplified implementation - in production, parse actual LUT files
    const data = imageData.data
    const intensity = settings.intensity

    // Apply LUT lookup (simplified)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255

      // Lookup in 3D LUT and interpolate
      // This is a placeholder - real implementation would use actual LUT data
      const newR = r * (1 - intensity) + (r * 0.95 + g * 0.03 + b * 0.02) * intensity
      const newG = g * (1 - intensity) + (r * 0.02 + g * 0.96 + b * 0.02) * intensity
      const newB = b * (1 - intensity) + (r * 0.02 + g * 0.03 + b * 0.95) * intensity

      data[i] = Math.max(0, Math.min(255, newR * 255))
      data[i + 1] = Math.max(0, Math.min(255, newG * 255))
      data[i + 2] = Math.max(0, Math.min(255, newB * 255))
    }

    return imageData
  }

  private applyBloom(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['bloom']>
  ): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    // Extract bright pixels
    const brightPixels = new Uint8ClampedArray(data.length)
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      if (lum > settings.threshold) {
        brightPixels[i] = data[i]
        brightPixels[i + 1] = data[i + 1]
        brightPixels[i + 2] = data[i + 2]
        brightPixels[i + 3] = data[i + 3]
      }
    }

    // Apply Gaussian blur to bright pixels
    const blurred = this.gaussianBlur(brightPixels, width, height, settings.radius)

    // Blend with original
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + blurred[i] * settings.intensity)
      data[i + 1] = Math.min(255, data[i + 1] + blurred[i + 1] * settings.intensity)
      data[i + 2] = Math.min(255, data[i + 2] + blurred[i + 2] * settings.intensity)
    }

    return imageData
  }

  private applyVignette(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['vignette']>
  ): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const centerX = width / 2
    const centerY = height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Calculate vignette factor
        let vignette = 1 - (dist / maxDist - settings.radius) / (1 - settings.radius)
        vignette = Math.pow(Math.max(0, Math.min(1, vignette)), 1 / settings.softness)
        vignette = 1 - (1 - vignette) * settings.intensity

        data[i] *= vignette
        data[i + 1] *= vignette
        data[i + 2] *= vignette
      }
    }

    return imageData
  }

  private applyChromaticAberration(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['chromaticAberration']>
  ): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const offset = settings.intensity * 5

    const original = new Uint8ClampedArray(data)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4

        // Red channel - shift left
        const rX = Math.max(0, Math.min(width - 1, x - offset))
        const rI = (y * width + Math.floor(rX)) * 4
        data[i] = original[rI]

        // Green channel - no shift
        data[i + 1] = original[i + 1]

        // Blue channel - shift right
        const bX = Math.max(0, Math.min(width - 1, x + offset))
        const bI = (y * width + Math.floor(bX)) * 4
        data[i + 2] = original[bI + 2]
      }
    }

    return imageData
  }

  private applyFilmGrain(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['filmGrain']>
  ): ImageData {
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 2 * settings.intensity * 50
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }

    return imageData
  }

  private applySharpen(
    imageData: ImageData,
    settings: NonNullable<PostFXSettings['sharpen']>
  ): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const original = new Uint8ClampedArray(data)

    // Sharpen kernel
    const kernel = [
      0, -settings.amount, 0,
      -settings.amount, 1 + 4 * settings.amount, -settings.amount,
      0, -settings.amount, 0
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const i = ((y + ky) * width + (x + kx)) * 4 + c
              const ki = (ky + 1) * 3 + (kx + 1)
              sum += original[i] * kernel[ki]
            }
          }
          const i = (y * width + x) * 4 + c
          data[i] = Math.max(0, Math.min(255, sum))
        }
      }
    }

    return imageData
  }

  private gaussianBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): Uint8ClampedArray {
    // Simplified Gaussian blur
    // In production, use optimized box blur approximation
    const result = new Uint8ClampedArray(data)

    // Generate Gaussian kernel
    const size = Math.ceil(radius) * 2 + 1
    const kernel = new Array(size)
    const sigma = radius / 3
    let sum = 0

    for (let i = 0; i < size; i++) {
      const x = i - Math.floor(size / 2)
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
      sum += kernel[i]
    }

    // Normalize kernel
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum
    }

    // Horizontal pass
    const temp = new Uint8ClampedArray(data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let k = 0; k < size; k++) {
            const sx = Math.max(0, Math.min(width - 1, x + k - Math.floor(size / 2)))
            sum += data[(y * width + sx) * 4 + c] * kernel[k]
          }
          temp[(y * width + x) * 4 + c] = sum
        }
      }
    }

    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let k = 0; k < size; k++) {
            const sy = Math.max(0, Math.min(height - 1, y + k - Math.floor(size / 2)))
            sum += temp[(sy * width + x) * 4 + c] * kernel[k]
          }
          result[(y * width + x) * 4 + c] = sum
        }
      }
    }

    return result
  }
}

// Preset LUTs
export const LUT_PRESETS = {
  warm_earthy: {
    name: 'Warm & Earthy',
    temperature: 10,
    tint: -5,
    saturation: 1.1,
    contrast: 1.05
  },
  neutral: {
    name: 'Neutral',
    temperature: 0,
    tint: 0,
    saturation: 1.0,
    contrast: 1.0
  },
  cool_dusk: {
    name: 'Cool Dusk',
    temperature: -15,
    tint: 5,
    saturation: 0.95,
    contrast: 1.1
  },
  cinematic: {
    name: 'Cinematic',
    temperature: 5,
    tint: -2,
    saturation: 1.15,
    contrast: 1.2
  }
}
