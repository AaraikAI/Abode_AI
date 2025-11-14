/**
 * Energy & Thermal Simulation Service
 *
 * Basic energy modeling for architectural designs:
 * - Thermal performance analysis
 * - Energy consumption estimation
 * - Solar gain calculations
 * - HVAC sizing
 * - Insulation recommendations
 * - Annual energy cost projections
 * - Carbon footprint estimation
 * - Green building compliance (LEED, BREEAM)
 */

export interface BuildingEnvelope {
  walls: {
    area: number // sq ft
    rValue: number // thermal resistance
    material: string
    orientation: 'north' | 'south' | 'east' | 'west'
  }[]
  windows: {
    area: number
    uValue: number // thermal transmittance
    shgc: number // solar heat gain coefficient
    orientation: 'north' | 'south' | 'east' | 'west'
  }[]
  roof: {
    area: number
    rValue: number
    material: string
    color: 'light' | 'medium' | 'dark'
  }
  foundation: {
    area: number
    rValue: number
    type: 'slab' | 'crawlspace' | 'basement'
  }
}

export interface ClimateData {
  location: {
    lat: number
    lng: number
    elevation: number
  }
  heatingDegreeDays: number // HDD base 65°F
  coolingDegreeDays: number // CDD base 65°F
  averageTemperature: {
    winter: number
    summer: number
    annual: number
  }
  solarRadiation: {
    winter: number // kWh/m²/day
    summer: number
    annual: number
  }
  humidity: {
    winter: number // %
    summer: number
  }
  windSpeed: number // mph
}

export interface OccupancyProfile {
  occupants: number
  schedule: {
    weekday: { start: number; end: number } // hours
    weekend: { start: number; end: number }
  }
  internalGains: {
    lighting: number // W/sq ft
    equipment: number // W/sq ft
    metabolic: number // W/person
  }
}

export interface HVACSystem {
  type: 'furnace' | 'heatpump' | 'minisplit' | 'boiler' | 'geothermal'
  heatingEfficiency: number // AFUE or COP
  coolingEfficiency: number // SEER or EER
  ventilation: {
    rate: number // CFM/person or ACH
    heatRecovery: boolean
    efficiency?: number // % if HRV/ERV
  }
}

export interface EnergySimulationParams {
  buildingArea: number // sq ft
  volume: number // cubic ft
  envelope: BuildingEnvelope
  climate: ClimateData
  occupancy: OccupancyProfile
  hvac: HVACSystem
  lighting?: {
    powerDensity: number // W/sq ft
    daylightingFactor: number // 0-1
  }
  appliances?: {
    annualConsumption: number // kWh
  }
  waterHeating?: {
    type: 'electric' | 'gas' | 'heatpump' | 'solar'
    efficiency: number
  }
}

export interface EnergyResults {
  annual: {
    heating: number // kWh
    cooling: number // kWh
    lighting: number // kWh
    equipment: number // kWh
    waterHeating: number // kWh
    total: number // kWh
  }
  monthly: {
    month: string
    heating: number
    cooling: number
    lighting: number
    equipment: number
    total: number
  }[]
  peak: {
    heating: number // kW
    cooling: number // kW
    total: number // kW
  }
  costs: {
    annual: number // $
    monthly: number // $
    perSqFt: number // $/sq ft
  }
  carbon: {
    annual: number // kg CO2
    perSqFt: number // kg CO2/sq ft
  }
  efficiency: {
    eui: number // kBtu/sq ft/year (Energy Use Intensity)
    euiNormalized: number // compared to baseline
    rating: 'excellent' | 'good' | 'average' | 'poor'
  }
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    description: string
    savings: number // kWh/year
    cost: number // $
    payback: number // years
  }[]
}

export class EnergySimulation {
  // Constants
  private readonly ENERGY_COST_PER_KWH = 0.13 // $/kWh (US average)
  private readonly CO2_PER_KWH = 0.92 // kg CO2/kWh (US grid average)
  private readonly BASELINE_EUI = 65 // kBtu/sq ft/year (residential)

  /**
   * Run energy simulation
   */
  async simulate(params: EnergySimulationParams): Promise<EnergyResults> {
    // Calculate heating loads
    const heatingLoad = this.calculateHeatingLoad(params)

    // Calculate cooling loads
    const coolingLoad = this.calculateCoolingLoad(params)

    // Calculate internal loads
    const lightingLoad = this.calculateLightingLoad(params)
    const equipmentLoad = this.calculateEquipmentLoad(params)
    const waterHeatingLoad = this.calculateWaterHeatingLoad(params)

    // Calculate monthly energy use
    const monthly = this.calculateMonthlyEnergy(params, heatingLoad, coolingLoad)

    // Calculate totals
    const annual = {
      heating: heatingLoad.annual,
      cooling: coolingLoad.annual,
      lighting: lightingLoad.annual,
      equipment: equipmentLoad.annual,
      waterHeating: waterHeatingLoad.annual,
      total: heatingLoad.annual + coolingLoad.annual + lightingLoad.annual +
             equipmentLoad.annual + waterHeatingLoad.annual
    }

    // Calculate peak demands
    const peak = {
      heating: heatingLoad.peak,
      cooling: coolingLoad.peak,
      total: Math.max(heatingLoad.peak, coolingLoad.peak) +
             (lightingLoad.peak || 0) + (equipmentLoad.peak || 0)
    }

    // Calculate costs
    const costs = {
      annual: annual.total * this.ENERGY_COST_PER_KWH,
      monthly: (annual.total * this.ENERGY_COST_PER_KWH) / 12,
      perSqFt: (annual.total * this.ENERGY_COST_PER_KWH) / params.buildingArea
    }

    // Calculate carbon emissions
    const carbon = {
      annual: annual.total * this.CO2_PER_KWH,
      perSqFt: (annual.total * this.CO2_PER_KWH) / params.buildingArea
    }

    // Calculate efficiency metrics
    const eui = (annual.total * 3.412) / params.buildingArea // Convert kWh to kBtu
    const euiNormalized = eui / this.BASELINE_EUI

    const efficiency = {
      eui,
      euiNormalized,
      rating: this.getRating(euiNormalized)
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(params, annual)

    return {
      annual,
      monthly,
      peak,
      costs,
      carbon,
      efficiency,
      recommendations
    }
  }

  /**
   * Calculate heating energy load
   */
  private calculateHeatingLoad(params: EnergySimulationParams): {
    annual: number
    peak: number
  } {
    const { buildingArea, envelope, climate, hvac } = params

    // Calculate UA (overall heat loss coefficient)
    let ua = 0

    // Walls
    for (const wall of envelope.walls) {
      ua += wall.area / wall.rValue
    }

    // Windows
    for (const window of envelope.windows) {
      ua += window.area * window.uValue
    }

    // Roof
    ua += envelope.roof.area / envelope.roof.rValue

    // Foundation
    ua += envelope.foundation.area / envelope.foundation.rValue

    // Infiltration (simplified)
    const volume = params.volume
    const infiltrationRate = 0.35 // ACH (air changes per hour)
    const airDensity = 0.075 // lb/cu ft
    const specificHeat = 0.24 // Btu/lb°F
    const infiltrationUA = (infiltrationRate * volume * airDensity * specificHeat) / 60

    const totalUA = ua + infiltrationUA

    // Annual heating load (degree-day method)
    const annualHeatLoss = totalUA * climate.heatingDegreeDays * 24 // Btu
    const annualHeating = (annualHeatLoss / (hvac.heatingEfficiency * 3412)) // kWh

    // Peak heating load
    const designTemp = climate.averageTemperature.winter - 10 // Design day
    const indoorTemp = 70 // °F
    const peakHeating = (totalUA * (indoorTemp - designTemp)) / 1000 // kW

    return {
      annual: annualHeating,
      peak: peakHeating
    }
  }

  /**
   * Calculate cooling energy load
   */
  private calculateCoolingLoad(params: EnergySimulationParams): {
    annual: number
    peak: number
  } {
    const { buildingArea, envelope, climate, hvac, occupancy } = params

    // Calculate transmission gains
    let transmissionGain = 0

    // Walls
    for (const wall of envelope.walls) {
      transmissionGain += wall.area / wall.rValue
    }

    // Windows
    for (const window of envelope.windows) {
      transmissionGain += window.area * window.uValue
    }

    // Roof (higher due to solar radiation)
    const roofMultiplier = envelope.roof.color === 'dark' ? 1.5 :
                           envelope.roof.color === 'medium' ? 1.2 : 1.0
    transmissionGain += (envelope.roof.area / envelope.roof.rValue) * roofMultiplier

    // Solar gains through windows
    let solarGain = 0
    for (const window of envelope.windows) {
      const orientationFactor = this.getSolarOrientationFactor(window.orientation)
      solarGain += window.area * window.shgc * climate.solarRadiation.summer * orientationFactor
    }

    // Internal gains
    const internalGain =
      (occupancy.internalGains.lighting * buildingArea) +
      (occupancy.internalGains.equipment * buildingArea) +
      (occupancy.internalGains.metabolic * occupancy.occupants)

    // Annual cooling load
    const dailyCoolingLoad = (transmissionGain * climate.coolingDegreeDays +
                              solarGain + internalGain / 1000) * 24 // Btu/day
    const annualCoolingLoad = dailyCoolingLoad * 365 // Btu
    const annualCooling = annualCoolingLoad / (hvac.coolingEfficiency * 3412) // kWh

    // Peak cooling load
    const designTemp = climate.averageTemperature.summer + 5 // Design day
    const indoorTemp = 75 // °F
    const peakCooling = (
      (transmissionGain * (designTemp - indoorTemp)) +
      (solarGain * 3412) +
      internalGain
    ) / 1000 // kW

    return {
      annual: annualCooling,
      peak: peakCooling
    }
  }

  /**
   * Calculate lighting energy load
   */
  private calculateLightingLoad(params: EnergySimulationParams): {
    annual: number
    peak?: number
  } {
    const lighting = params.lighting || { powerDensity: 1.0, daylightingFactor: 0.3 }

    const hoursPerDay = 6 // Average hours of artificial lighting
    const daysPerYear = 365
    const daylightReduction = lighting.daylightingFactor

    const annualLighting =
      params.buildingArea *
      lighting.powerDensity *
      hoursPerDay *
      daysPerYear *
      (1 - daylightReduction) / 1000 // kWh

    return {
      annual: annualLighting,
      peak: (params.buildingArea * lighting.powerDensity) / 1000 // kW
    }
  }

  /**
   * Calculate equipment energy load
   */
  private calculateEquipmentLoad(params: EnergySimulationParams): {
    annual: number
    peak?: number
  } {
    const appliances = params.appliances || { annualConsumption: 3000 }

    return {
      annual: appliances.annualConsumption,
      peak: 3 // kW (typical peak)
    }
  }

  /**
   * Calculate water heating load
   */
  private calculateWaterHeatingLoad(params: EnergySimulationParams): {
    annual: number
  } {
    const waterHeating = params.waterHeating || {
      type: 'electric',
      efficiency: 0.95
    }

    // Simplified water heating calculation
    // Average 18 gallons/person/day at 120°F
    const gallonsPerDay = params.occupancy.occupants * 18
    const tempRise = 70 // °F (assuming 50°F inlet)
    const energyPerGallon = 8.33 * tempRise / 3412 // kWh

    const annualWaterHeating =
      (gallonsPerDay * energyPerGallon * 365) / waterHeating.efficiency

    return {
      annual: annualWaterHeating
    }
  }

  /**
   * Calculate monthly energy breakdown
   */
  private calculateMonthlyEnergy(
    params: EnergySimulationParams,
    heatingLoad: { annual: number },
    coolingLoad: { annual: number }
  ): EnergyResults['monthly'] {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Simplified monthly distribution
    const heatingDistribution = [0.15, 0.14, 0.12, 0.08, 0.03, 0.01, 0.01, 0.01, 0.03, 0.08, 0.12, 0.16]
    const coolingDistribution = [0.02, 0.02, 0.05, 0.08, 0.12, 0.16, 0.18, 0.17, 0.12, 0.06, 0.02, 0.01]

    return months.map((month, i) => ({
      month,
      heating: heatingLoad.annual * heatingDistribution[i],
      cooling: coolingLoad.annual * coolingDistribution[i],
      lighting: (params.lighting?.powerDensity || 1.0) * params.buildingArea * 6 * 30 / 1000,
      equipment: (params.appliances?.annualConsumption || 3000) / 12,
      total:
        (heatingLoad.annual * heatingDistribution[i]) +
        (coolingLoad.annual * coolingDistribution[i]) +
        ((params.lighting?.powerDensity || 1.0) * params.buildingArea * 6 * 30 / 1000) +
        ((params.appliances?.annualConsumption || 3000) / 12)
    }))
  }

  /**
   * Get solar orientation factor
   */
  private getSolarOrientationFactor(orientation: string): number {
    const factors = {
      south: 1.0,
      east: 0.7,
      west: 0.7,
      north: 0.3
    }
    return factors[orientation as keyof typeof factors] || 0.6
  }

  /**
   * Get efficiency rating
   */
  private getRating(euiNormalized: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (euiNormalized < 0.5) return 'excellent'
    if (euiNormalized < 0.75) return 'good'
    if (euiNormalized < 1.25) return 'average'
    return 'poor'
  }

  /**
   * Generate energy efficiency recommendations
   */
  private generateRecommendations(
    params: EnergySimulationParams,
    annual: EnergyResults['annual']
  ): EnergyResults['recommendations'] {
    const recommendations: EnergyResults['recommendations'] = []

    // Check wall insulation
    const avgWallR = params.envelope.walls.reduce((sum, w) => sum + w.rValue, 0) /
                     params.envelope.walls.length
    if (avgWallR < 20) {
      recommendations.push({
        priority: 'high',
        category: 'Insulation',
        description: 'Increase wall insulation to R-20 or higher',
        savings: annual.heating * 0.2, // 20% savings
        cost: params.buildingArea * 2.5, // $2.50/sq ft
        payback: (params.buildingArea * 2.5) / (annual.heating * 0.2 * this.ENERGY_COST_PER_KWH)
      })
    }

    // Check window efficiency
    const avgWindowU = params.envelope.windows.reduce((sum, w) => sum + w.uValue, 0) /
                       params.envelope.windows.length
    if (avgWindowU > 0.35) {
      recommendations.push({
        priority: 'medium',
        category: 'Windows',
        description: 'Upgrade to energy-efficient windows (U < 0.30)',
        savings: (annual.heating + annual.cooling) * 0.15,
        cost: params.envelope.windows.reduce((sum, w) => sum + w.area, 0) * 40, // $40/sq ft
        payback: 15
      })
    }

    // Check HVAC efficiency
    if (params.hvac.heatingEfficiency < 0.95) {
      recommendations.push({
        priority: 'medium',
        category: 'HVAC',
        description: 'Upgrade to high-efficiency heating system (95%+ AFUE)',
        savings: annual.heating * 0.25,
        cost: 6000,
        payback: 6000 / (annual.heating * 0.25 * this.ENERGY_COST_PER_KWH)
      })
    }

    // Check lighting
    if ((params.lighting?.powerDensity || 1.0) > 0.8) {
      recommendations.push({
        priority: 'low',
        category: 'Lighting',
        description: 'Replace with LED lighting',
        savings: annual.lighting * 0.6,
        cost: params.buildingArea * 1.5,
        payback: (params.buildingArea * 1.5) / (annual.lighting * 0.6 * this.ENERGY_COST_PER_KWH)
      })
    }

    // Check roof color
    if (params.envelope.roof.color === 'dark' && params.climate.coolingDegreeDays > 1000) {
      recommendations.push({
        priority: 'low',
        category: 'Cool Roof',
        description: 'Install light-colored or reflective roofing',
        savings: annual.cooling * 0.1,
        cost: params.envelope.roof.area * 3,
        payback: (params.envelope.roof.area * 3) / (annual.cooling * 0.1 * this.ENERGY_COST_PER_KWH)
      })
    }

    // Sort by payback period
    return recommendations.sort((a, b) => a.payback - b.payback)
  }
}

/**
 * Climate data lookup service
 */
export class ClimateDataService {
  /**
   * Get climate data for location
   */
  async getClimateData(lat: number, lng: number): Promise<ClimateData> {
    // In production, integrate with weather APIs (NOAA, OpenWeatherMap, etc.)
    // For now, return estimated data based on latitude

    const isNorthern = lat > 37
    const isSouthern = lat < 32

    return {
      location: { lat, lng, elevation: 0 },
      heatingDegreeDays: isNorthern ? 5500 : isSouthern ? 1500 : 3500,
      coolingDegreeDays: isNorthern ? 800 : isSouthern ? 2800 : 1500,
      averageTemperature: {
        winter: isNorthern ? 25 : isSouthern ? 55 : 40,
        summer: isNorthern ? 75 : isSouthern ? 90 : 82,
        annual: isNorthern ? 50 : isSouthern ? 70 : 60
      },
      solarRadiation: {
        winter: isNorthern ? 2 : isSouthern ? 4 : 3,
        summer: isNorthern ? 6 : isSouthern ? 7 : 6.5,
        annual: isNorthern ? 4 : isSouthern ? 5.5 : 4.8
      },
      humidity: {
        winter: 65,
        summer: 70
      },
      windSpeed: 10
    }
  }
}

/**
 * Material R-Value database
 */
export const MATERIAL_R_VALUES = {
  // Wall materials (per inch)
  'brick': 0.2,
  'concrete': 0.08,
  'wood_siding': 0.81,
  'vinyl_siding': 0.61,
  'stucco': 0.20,

  // Insulation (per inch)
  'fiberglass_batt': 3.14,
  'cellulose': 3.70,
  'spray_foam_open': 3.60,
  'spray_foam_closed': 6.25,
  'rigid_foam': 5.00,

  // Roof materials
  'asphalt_shingles': 0.44,
  'metal_roofing': 0.00,
  'tile_roofing': 0.80,

  // Foundation
  'concrete_slab': 0.08,
  'basement_wall': 0.08
}
