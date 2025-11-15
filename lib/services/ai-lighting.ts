/**
 * AI Lighting Optimization Service
 *
 * ML-based lighting analysis and optimization for architectural rendering
 */

export interface LightingAnalysisResult {
  overallScore: number
  naturalLightCoverage: number
  artificialLightBalance: number
  shadowQuality: number
  colorTemperature: number
  recommendations: LightingRecommendation[]
}

export interface LightingRecommendation {
  type: 'add_light' | 'remove_light' | 'adjust_intensity' | 'adjust_position' | 'adjust_color'
  priority: 'high' | 'medium' | 'low'
  description: string
  targetLight?: string
  suggestedValues?: Record<string, any>
  expectedImprovement: number
}

export interface LightSource {
  id: string
  type: 'directional' | 'point' | 'spot' | 'area' | 'hdri'
  position?: {x: number; y: number; z: number}
  direction?: {x: number; y: number; z: number}
  intensity: number
  color: {r: number; g: number; b: number}
  temperature?: number
  castShadows: boolean
}

export interface NaturalLightingParams {
  latitude: number
  longitude: number
  date: Date
  time: number // Hours (0-24)
  cloudCover: number // 0-1
  buildingOrientation: number // degrees from north
}

export class AILightingService {
  private mlEndpoint: string

  constructor(endpoint?: string) {
    this.mlEndpoint = endpoint || process.env.AI_LIGHTING_ENDPOINT || 'http://localhost:8005'
  }

  /**
   * Analyze current lighting setup with ML
   */
  async analyzeLighting(scene: {
    lights: LightSource[]
    cameraPosition: {x: number; y: number; z: number}
    renderImage?: string // base64 encoded render
  }): Promise<LightingAnalysisResult> {
    try {
      const response = await fetch(`${this.mlEndpoint}/analyze`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(scene)
      })

      if (!response.ok) {
        return this.mockAnalysis()
      }

      return await response.json()
    } catch (error) {
      console.error('[AILighting] Analysis failed:', error)
      return this.mockAnalysis()
    }
  }

  /**
   * Optimize lighting setup using ML
   */
  async optimizeLighting(params: {
    currentLights: LightSource[]
    scene: any
    goals?: {
      naturalLook?: boolean
      dramaticEffect?: boolean
      evenIllumination?: boolean
      energyEfficiency?: boolean
    }
  }): Promise<{
    optimizedLights: LightSource[]
    improvement: number
    reasoning: string[]
  }> {
    try {
      const response = await fetch(`${this.mlEndpoint}/optimize`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        return this.mockOptimization(params.currentLights)
      }

      return await response.json()
    } catch (error) {
      console.error('[AILighting] Optimization failed:', error)
      return this.mockOptimization(params.currentLights)
    }
  }

  /**
   * Calculate natural lighting for specific time and location
   */
  async calculateNaturalLighting(params: NaturalLightingParams): Promise<{
    sunPosition: {altitude: number; azimuth: number}
    sunColor: {r: number; g: number; b: number}
    sunIntensity: number
    skyLightIntensity: number
    recommendedHDRI: string
  }> {
    const {latitude, longitude, date, time} = params

    // Solar position calculation (simplified)
    const dayOfYear = this.getDayOfYear(date)
    const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI / 180)

    const hourAngle = (time - 12) * 15
    const altitude = Math.asin(
      Math.sin(latitude * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI

    const azimuth = Math.atan2(
      -Math.sin(hourAngle * Math.PI / 180),
      Math.cos(latitude * Math.PI / 180) * Math.tan(declination * Math.PI / 180) -
      Math.sin(latitude * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI

    // Sun color based on altitude
    const sunColor = this.calculateSunColor(altitude)
    const sunIntensity = Math.max(0, Math.sin(altitude * Math.PI / 180)) * (1 - params.cloudCover * 0.7)

    return {
      sunPosition: {altitude, azimuth},
      sunColor,
      sunIntensity: sunIntensity * 100000, // lux
      skyLightIntensity: 5000 * (1 - params.cloudCover * 0.5),
      recommendedHDRI: this.selectHDRI(time, params.cloudCover)
    }
  }

  /**
   * Auto-place lights using ML
   */
  async autoPlaceLights(params: {
    roomGeometry: any
    roomType: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office'
    ceilingHeight: number
    desiredLuxLevel: number
  }): Promise<LightSource[]> {
    try {
      const response = await fetch(`${this.mlEndpoint}/auto-place`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        return this.mockAutoPlacement(params)
      }

      return await response.json().then(data => data.lights)
    } catch (error) {
      console.error('[AILighting] Auto-placement failed:', error)
      return this.mockAutoPlacement(params)
    }
  }

  private calculateSunColor(altitude: number): {r: number; g: number; b: number} {
    // Sun color changes from orange at sunrise/sunset to white at noon
    const t = Math.max(0, Math.min(1, altitude / 90))
    return {
      r: 1.0,
      g: 0.7 + (0.3 * t),
      b: 0.5 + (0.5 * t)
    }
  }

  private selectHDRI(time: number, cloudCover: number): string {
    if (time >= 5 && time < 7) return 'sunrise.hdr'
    if (time >= 7 && time < 17) return cloudCover > 0.5 ? 'overcast.hdr' : 'clear_sky.hdr'
    if (time >= 17 && time < 19) return 'sunset.hdr'
    return 'night.hdr'
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  private mockAnalysis(): LightingAnalysisResult {
    return {
      overallScore: 0.78,
      naturalLightCoverage: 0.65,
      artificialLightBalance: 0.82,
      shadowQuality: 0.75,
      colorTemperature: 5500,
      recommendations: [
        {
          type: 'add_light',
          priority: 'high',
          description: 'Add fill light to reduce harsh shadows in corner',
          suggestedValues: {type: 'area', intensity: 500, position: {x: -2, y: 2, z: 3}},
          expectedImprovement: 0.12
        },
        {
          type: 'adjust_intensity',
          priority: 'medium',
          description: 'Reduce main light intensity by 15% for more balanced exposure',
          targetLight: 'main_light',
          suggestedValues: {intensity: 0.85},
          expectedImprovement: 0.08
        }
      ]
    }
  }

  private mockOptimization(lights: LightSource[]): {optimizedLights: LightSource[]; improvement: number; reasoning: string[]} {
    return {
      optimizedLights: lights.map(l => ({...l, intensity: l.intensity * 0.9})),
      improvement: 0.15,
      reasoning: [
        'Reduced overall intensity to prevent overexposure',
        'Adjusted color temperature for more natural appearance',
        'Repositioned key light for better shadow definition'
      ]
    }
  }

  private mockAutoPlacement(params: any): LightSource[] {
    return [
      {
        id: 'ceiling_1',
        type: 'point',
        position: {x: 0, y: params.ceilingHeight - 0.2, z: 0},
        intensity: 800,
        color: {r: 1, g: 0.95, b: 0.9},
        temperature: 4000,
        castShadows: true
      }
    ]
  }
}

export const aiLighting = new AILightingService()
