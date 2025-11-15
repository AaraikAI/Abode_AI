/**
 * Predictive Risk Models Service
 *
 * Seismic, flood, fire, structural failure, and climate change impact analysis
 */

export interface RiskAssessment {
  overall: number // 0-1
  confidence: number // 0-1
  factors: RiskFactor[]
  recommendations: string[]
  timestamp: Date
}

export interface RiskFactor {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  impact: number
  description: string
}

export interface SeismicRiskParams {
  latitude: number
  longitude: number
  buildingType: 'residential' | 'commercial' | 'industrial'
  stories: number
  constructionYear: number
  foundationType: 'slab' | 'crawlspace' | 'basement' | 'piles'
}

export interface FloodRiskParams {
  latitude: number
  longitude: number
  elevation: number
  proximityToWater: number // meters
  drainageQuality: 'poor' | 'fair' | 'good' | 'excellent'
}

export interface FireRiskParams {
  buildingMaterials: Array<{type: string; percentage: number}>
  occupancyType: string
  fireSuppressionSystems: string[]
  exitCount: number
  floorArea: number
}

export interface StructuralFailureParams {
  age: number
  loadingConditions: {dead: number; live: number; wind: number; snow: number}
  inspectionHistory: Array<{date: Date; rating: number}>
  materialCondition: 'new' | 'good' | 'fair' | 'poor' | 'critical'
}

export class PredictiveRiskModelsService {
  /**
   * Assess seismic risk
   */
  async assessSeismicRisk(params: SeismicRiskParams): Promise<RiskAssessment> {
    // Get seismic zone data
    const seismicZone = await this.getSeismicZone(params.latitude, params.longitude)

    // Calculate building vulnerability
    const vulnerability = this.calculateSeismicVulnerability(params)

    // Combine for overall risk
    const probability = seismicZone.pga / 1.0 // Peak Ground Acceleration normalized
    const impact = vulnerability

    const factors: RiskFactor[] = [
      {
        type: 'seismic_zone',
        severity: seismicZone.zone >= 4 ? 'critical' : seismicZone.zone >= 3 ? 'high' : 'medium',
        probability: probability,
        impact: 0.8,
        description: `Located in seismic zone ${seismicZone.zone} with PGA ${seismicZone.pga}g`
      },
      {
        type: 'building_age',
        severity: params.constructionYear < 1980 ? 'high' : 'medium',
        probability: 0.3,
        impact: 0.6,
        description: `Building constructed in ${params.constructionYear} ${params.constructionYear < 1980 ? 'before modern seismic codes' : ''}`
      },
      {
        type: 'structural_type',
        severity: vulnerability > 0.7 ? 'high' : 'medium',
        probability: 0.4,
        impact: vulnerability,
        description: `${params.buildingType} structure with ${params.stories} stories`
      }
    ]

    const overall = probability * impact

    return {
      overall,
      confidence: 0.85,
      factors,
      recommendations: this.generateSeismicRecommendations(params, overall),
      timestamp: new Date()
    }
  }

  /**
   * Assess flood risk
   */
  async assessFloodRisk(params: FloodRiskParams): Promise<RiskAssessment> {
    // Get flood zone data
    const floodZone = await this.getFloodZone(params.latitude, params.longitude)

    // Calculate flood probability based on elevation and proximity
    const elevationRisk = Math.max(0, 1 - (params.elevation / 50)) // Higher elevation = lower risk
    const proximityRisk = Math.max(0, 1 - (params.proximityToWater / 1000)) // Further from water = lower risk
    const drainageScore = {poor: 0.9, fair: 0.6, good: 0.3, excellent: 0.1}[params.drainageQuality]

    const probability = (elevationRisk * 0.4 + proximityRisk * 0.3 + drainageScore * 0.3) * floodZone.factor

    const factors: RiskFactor[] = [
      {
        type: 'flood_zone',
        severity: floodZone.zone.startsWith('A') ? 'critical' : floodZone.zone.startsWith('X') ? 'low' : 'medium',
        probability: floodZone.annualProbability,
        impact: 0.9,
        description: `Located in FEMA flood zone ${floodZone.zone}`
      },
      {
        type: 'elevation',
        severity: params.elevation < 10 ? 'high' : 'medium',
        probability: elevationRisk,
        impact: 0.7,
        description: `Elevation: ${params.elevation}m above base flood level`
      },
      {
        type: 'drainage',
        severity: params.drainageQuality === 'poor' ? 'high' : 'low',
        probability: drainageScore,
        impact: 0.5,
        description: `Drainage quality: ${params.drainageQuality}`
      }
    ]

    return {
      overall: probability,
      confidence: 0.80,
      factors,
      recommendations: this.generateFloodRecommendations(params, probability),
      timestamp: new Date()
    }
  }

  /**
   * Assess fire risk
   */
  async assessFireRisk(params: FireRiskParams): Promise<RiskAssessment> {
    // Calculate material flammability
    const materialRisk = params.buildingMaterials.reduce((risk, material) => {
      const flammability = this.getMaterialFlammability(material.type)
      return risk + (flammability * material.percentage / 100)
    }, 0)

    // Calculate suppression effectiveness
    const suppressionScore = params.fireSuppressionSystems.length * 0.15
    const exitScore = Math.min(1, params.exitCount / (params.floorArea / 1000))

    const probability = (materialRisk * 0.5 - suppressionScore * 0.3 + (1 - exitScore) * 0.2)

    const factors: RiskFactor[] = [
      {
        type: 'combustible_materials',
        severity: materialRisk > 0.7 ? 'high' : 'medium',
        probability: materialRisk,
        impact: 0.8,
        description: 'Building materials combustibility assessment'
      },
      {
        type: 'fire_suppression',
        severity: params.fireSuppressionSystems.length === 0 ? 'critical' : 'low',
        probability: 0.3,
        impact: 0.9,
        description: `${params.fireSuppressionSystems.length} suppression systems installed`
      },
      {
        type: 'egress',
        severity: exitScore < 0.5 ? 'high' : 'low',
        probability: 0.4,
        impact: 0.7,
        description: `${params.exitCount} exits for ${params.floorArea}m² floor area`
      }
    ]

    return {
      overall: probability,
      confidence: 0.75,
      factors,
      recommendations: this.generateFireRecommendations(params, probability),
      timestamp: new Date()
    }
  }

  /**
   * Assess structural failure risk
   */
  async assessStructuralFailure(params: StructuralFailureParams): Promise<RiskAssessment> {
    // Age-based deterioration
    const ageRisk = Math.min(1, params.age / 100)

    // Loading analysis
    const totalLoad = params.loadingConditions.dead + params.loadingConditions.live +
                     params.loadingConditions.wind + params.loadingConditions.snow
    const loadRisk = totalLoad > 5000 ? 0.7 : totalLoad > 3000 ? 0.5 : 0.3

    // Material condition
    const conditionRisk = {new: 0.1, good: 0.2, fair: 0.5, poor: 0.8, critical: 0.95}[params.materialCondition]

    // Inspection history trend
    const inspectionTrend = this.analyzeInspectionTrend(params.inspectionHistory)

    const probability = (ageRisk * 0.3 + loadRisk * 0.3 + conditionRisk * 0.3 + inspectionTrend * 0.1)

    const factors: RiskFactor[] = [
      {
        type: 'age_deterioration',
        severity: params.age > 50 ? 'high' : 'medium',
        probability: ageRisk,
        impact: 0.6,
        description: `Structure is ${params.age} years old`
      },
      {
        type: 'loading_conditions',
        severity: loadRisk > 0.6 ? 'high' : 'medium',
        probability: loadRisk,
        impact: 0.8,
        description: `Total design load: ${totalLoad} kN/m²`
      },
      {
        type: 'material_condition',
        severity: conditionRisk > 0.7 ? 'critical' : 'medium',
        probability: conditionRisk,
        impact: 0.9,
        description: `Material condition rated as ${params.materialCondition}`
      }
    ]

    return {
      overall: probability,
      confidence: 0.70,
      factors,
      recommendations: this.generateStructuralRecommendations(params, probability),
      timestamp: new Date()
    }
  }

  /**
   * Assess climate change impacts
   */
  async assessClimateImpact(params: {
    latitude: number
    longitude: number
    projectionYear: number
  }): Promise<{
    temperatureChange: number
    precipitationChange: number
    extremeEventFrequency: number
    seaLevelRise: number
    impacts: string[]
  }> {
    const yearsAhead = params.projectionYear - new Date().getFullYear()

    return {
      temperatureChange: yearsAhead * 0.02, // °C per year
      precipitationChange: yearsAhead * 0.005, // % per year
      extremeEventFrequency: Math.min(2, 1 + yearsAhead * 0.01),
      seaLevelRise: yearsAhead * 0.003, // meters per year
      impacts: [
        'Increased cooling load requirements',
        'Higher flood risk from intense precipitation',
        'Increased wildfire risk',
        'Heat stress on building materials'
      ]
    }
  }

  // Helper methods

  private async getSeismicZone(lat: number, lon: number): Promise<{zone: number; pga: number}> {
    // Try to fetch from USGS Seismic Design Maps API
    const usgsApiKey = process.env.USGS_API_KEY

    if (usgsApiKey) {
      try {
        const response = await fetch(
          `https://earthquake.usgs.gov/ws/designmaps/asce7-16.json?latitude=${lat}&longitude=${lon}&riskCategory=ii&siteClass=c&title=Abode`,
          {
            headers: {
              'Authorization': `Bearer ${usgsApiKey}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()

          // Extract PGA and determine zone
          const pga = data.response?.data?.pga || 0.15
          const ss = data.response?.data?.ss || 0.5 // Short-period spectral acceleration

          // Determine seismic zone based on ASCE 7-16 criteria
          let zone = 1
          if (ss >= 1.5) zone = 4
          else if (ss >= 1.0) zone = 3
          else if (ss >= 0.5) zone = 2

          console.log(`[RiskModels] USGS seismic data: PGA=${pga}g, Ss=${ss}, Zone=${zone}`)

          return { zone, pga }
        }
      } catch (error) {
        console.error('[RiskModels] Failed to fetch USGS data:', error)
      }
    }

    // Fallback: mock based on location
    const isHighRisk = Math.abs(lat) > 30 && Math.abs(lat) < 40
    return {
      zone: isHighRisk ? 4 : 2,
      pga: isHighRisk ? 0.4 : 0.15
    }
  }

  private async getFloodZone(lat: number, lon: number): Promise<{zone: string; annualProbability: number; factor: number}> {
    // Try to fetch from FEMA Flood Map Service Center API
    const femaApiKey = process.env.FEMA_API_KEY

    if (femaApiKey) {
      try {
        const response = await fetch(
          `https://hazards.fema.gov/gis/nfhl/rest/services/FIRMette/GPServer/FIRMette/execute`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${femaApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              Lat: lat,
              Long: lon,
              f: 'json'
            })
          }
        )

        if (response.ok) {
          const data = await response.json()

          // Extract flood zone designation
          const zone = data.results?.[0]?.value?.floodZone || 'X'

          // Map FEMA zones to risk factors
          let annualProbability = 0.002 // Default 0.2%
          let factor = 1.0

          // High Risk Areas (1% annual chance)
          if (['A', 'AE', 'AH', 'AO', 'V', 'VE'].includes(zone)) {
            annualProbability = 0.01
            factor = 1.5
          }
          // Moderate Risk Areas (0.2% annual chance)
          else if (zone === 'X' && zone.includes('shaded')) {
            annualProbability = 0.002
            factor = 1.2
          }
          // Low Risk Areas
          else {
            annualProbability = 0.001
            factor = 1.0
          }

          console.log(`[RiskModels] FEMA flood data: Zone=${zone}, Probability=${annualProbability}`)

          return { zone, annualProbability, factor }
        }
      } catch (error) {
        console.error('[RiskModels] Failed to fetch FEMA data:', error)
      }
    }

    // Fallback: moderate risk
    return {
      zone: 'X',
      annualProbability: 0.002,
      factor: 1.0
    }
  }

  private calculateSeismicVulnerability(params: SeismicRiskParams): number {
    let vulnerability = 0.5

    // Older buildings more vulnerable
    if (params.constructionYear < 1980) vulnerability += 0.2
    if (params.constructionYear < 1960) vulnerability += 0.1

    // Taller buildings more vulnerable
    if (params.stories > 5) vulnerability += 0.1
    if (params.stories > 10) vulnerability += 0.1

    // Foundation type
    if (params.foundationType === 'piles') vulnerability -= 0.1

    return Math.min(1, vulnerability)
  }

  private getMaterialFlammability(type: string): number {
    const flammability: Record<string, number> = {
      'wood': 0.8,
      'drywall': 0.3,
      'concrete': 0.1,
      'steel': 0.1,
      'foam_insulation': 0.9,
      'vinyl_siding': 0.7
    }
    return flammability[type] || 0.5
  }

  private analyzeInspectionTrend(history: Array<{date: Date; rating: number}>): number {
    if (history.length < 2) return 0.5

    const recent = history.slice(-3)
    const trend = recent.reduce((sum, h) => sum + h.rating, 0) / recent.length
    return 1 - trend // Lower ratings = higher risk
  }

  private generateSeismicRecommendations(params: SeismicRiskParams, risk: number): string[] {
    const recs: string[] = []
    if (risk > 0.6) recs.push('Consider seismic retrofit with moment frames')
    if (params.constructionYear < 1980) recs.push('Update to current seismic code standards')
    if (params.stories > 5) recs.push('Install base isolation system')
    recs.push('Conduct detailed seismic assessment by structural engineer')
    return recs
  }

  private generateFloodRecommendations(params: FloodRiskParams, risk: number): string[] {
    const recs: string[] = []
    if (risk > 0.5) recs.push('Install flood barriers and sump pumps')
    if (params.elevation < 10) recs.push('Elevate critical systems above base flood elevation')
    if (params.drainageQuality === 'poor') recs.push('Improve site drainage and grading')
    recs.push('Obtain flood insurance')
    return recs
  }

  private generateFireRecommendations(params: FireRiskParams, risk: number): string[] {
    const recs: string[] = []
    if (params.fireSuppressionSystems.length === 0) recs.push('Install automatic sprinkler system')
    if (params.exitCount < params.floorArea / 1000) recs.push('Add additional emergency exits')
    recs.push('Install fire-resistant materials in high-risk areas')
    recs.push('Conduct annual fire safety inspections')
    return recs
  }

  private generateStructuralRecommendations(params: StructuralFailureParams, risk: number): string[] {
    const recs: string[] = []
    if (params.age > 50) recs.push('Conduct comprehensive structural assessment')
    if (params.materialCondition === 'poor' || params.materialCondition === 'critical') {
      recs.push('Immediate repairs required for critical structural elements')
    }
    recs.push('Increase inspection frequency to annual')
    return recs
  }
}

export const predictiveRiskModels = new PredictiveRiskModelsService()
