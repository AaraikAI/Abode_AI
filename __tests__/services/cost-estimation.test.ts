/**
 * Cost Estimation Service Tests
 * Tests material takeoff, labor costs, regional pricing, and detailed breakdowns
 */

import { CostEstimationService } from '@/lib/services/cost-estimation'

describe('CostEstimationService', () => {
  let service: CostEstimationService

  beforeEach(() => {
    service = new CostEstimationService()
  })

  describe('Material Takeoff', () => {
    test('should calculate material quantities from 3D model', async () => {
      const model = {
        walls: [
          { id: 'w1', length: 20, height: 8, thickness: 0.5 },
          { id: 'w2', length: 15, height: 8, thickness: 0.5 }
        ],
        floors: [
          { id: 'f1', area: 300 }
        ]
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model)

      expect(takeoff.materials).toBeDefined()
      expect(takeoff.materials.drywall).toBeDefined()
      expect(takeoff.materials.lumber).toBeDefined()
      expect(takeoff.materials.flooring).toBeDefined()
    })

    test('should calculate drywall quantities correctly', async () => {
      const model = {
        walls: [
          { id: 'w1', length: 20, height: 8, thickness: 0.5 }
        ]
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model)

      // 20ft * 8ft = 160 sqft, both sides = 320 sqft
      // Drywall comes in 4x8 sheets = 32 sqft each
      // Need 320/32 = 10 sheets
      expect(takeoff.materials.drywall.quantity).toBeCloseTo(10, 0)
      expect(takeoff.materials.drywall.unit).toBe('sheets')
    })

    test('should calculate concrete quantities', async () => {
      const model = {
        foundations: [
          { type: 'slab', area: 1000, thickness: 4 } // inches
        ]
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model)

      // 1000 sqft * 4/12 ft = 333.33 cubic feet
      // Convert to cubic yards: 333.33 / 27 = 12.35 yards
      expect(takeoff.materials.concrete.quantity).toBeCloseTo(12.35, 1)
      expect(takeoff.materials.concrete.unit).toBe('cubic_yards')
    })

    test('should calculate roofing materials', async () => {
      const model = {
        roof: {
          area: 1500, // sqft
          pitch: 6, // 6:12 pitch
          type: 'asphalt_shingle'
        }
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model)

      expect(takeoff.materials.roofing.quantity).toBeCloseTo(15, 0) // squares
      expect(takeoff.materials.roofing.type).toBe('asphalt_shingle')
    })

    test('should include waste factor', async () => {
      const model = {
        floors: [{ id: 'f1', area: 100 }]
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model, {
        wasteFactor: 0.1 // 10% waste
      })

      // 100 sqft + 10% = 110 sqft
      expect(takeoff.materials.flooring.quantity).toBeCloseTo(110, 0)
    })

    test('should handle custom materials', async () => {
      const model = {
        custom: [
          {
            name: 'Custom Tile',
            quantity: 500,
            unit: 'sqft'
          }
        ]
      }

      const takeoff = await service.calculateMaterialTakeoff('project-123', model)

      expect(takeoff.materials.customTile).toBeDefined()
      expect(takeoff.materials.customTile.quantity).toBe(500)
    })
  })

  describe('Labor Cost Estimation', () => {
    test('should estimate labor costs by trade', async () => {
      const estimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '90210',
        squareFootage: 2000
      })

      expect(estimate.trades).toHaveProperty('framing')
      expect(estimate.trades).toHaveProperty('electrical')
      expect(estimate.trades).toHaveProperty('plumbing')
      expect(estimate.trades).toHaveProperty('drywall')
    })

    test('should calculate framing labor', async () => {
      const estimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '90210',
        squareFootage: 2000,
        wallLinearFeet: 200
      })

      expect(estimate.trades.framing.hours).toBeGreaterThan(0)
      expect(estimate.trades.framing.rate).toBeGreaterThan(0)
      expect(estimate.trades.framing.total).toBe(
        estimate.trades.framing.hours * estimate.trades.framing.rate
      )
    })

    test('should apply regional wage adjustments', async () => {
      const nyEstimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '10001', // Manhattan
        squareFootage: 2000
      })

      const ruralEstimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '65101', // Rural Missouri
        squareFootage: 2000
      })

      expect(nyEstimate.trades.framing.rate).toBeGreaterThan(
        ruralEstimate.trades.framing.rate
      )
    })

    test('should include union vs non-union rates', async () => {
      const unionEstimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '90210',
        squareFootage: 2000,
        laborType: 'union'
      })

      const nonUnionEstimate = await service.estimateLaborCosts({
        projectId: 'project-123',
        zipCode: '90210',
        squareFootage: 2000,
        laborType: 'non-union'
      })

      expect(unionEstimate.total).toBeGreaterThan(nonUnionEstimate.total)
    })
  })

  describe('Regional Pricing', () => {
    test('should fetch regional material prices', async () => {
      const pricing = await service.getRegionalPricing('90210')

      expect(pricing).toHaveProperty('lumber')
      expect(pricing).toHaveProperty('concrete')
      expect(pricing).toHaveProperty('drywall')
      expect(pricing.updatedAt).toBeDefined()
    })

    test('should adjust for local market conditions', async () => {
      const normalMarket = await service.getRegionalPricing('65101')
      const hotMarket = await service.getRegionalPricing('78701') // Austin, TX

      expect(hotMarket.lumber.pricePerUnit).toBeGreaterThanOrEqual(
        normalMarket.lumber.pricePerUnit * 0.9 // Allow for some variance
      )
    })

    test('should cache pricing data', async () => {
      const start1 = Date.now()
      await service.getRegionalPricing('90210')
      const time1 = Date.now() - start1

      const start2 = Date.now()
      await service.getRegionalPricing('90210')
      const time2 = Date.now() - start2

      expect(time2).toBeLessThan(time1) // Cached should be faster
    })
  })

  describe('Complete Cost Estimate', () => {
    test('should generate complete estimate with all components', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: {
          walls: [{ length: 20, height: 8, thickness: 0.5 }],
          floors: [{ area: 300 }],
          roof: { area: 400 }
        }
      })

      expect(estimate).toHaveProperty('materials')
      expect(estimate).toHaveProperty('labor')
      expect(estimate).toHaveProperty('permits')
      expect(estimate).toHaveProperty('subtotal')
      expect(estimate).toHaveProperty('contingency')
      expect(estimate).toHaveProperty('total')
    })

    test('should include permit costs', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: {
          squareFootage: 2000,
          projectValue: 300000
        },
        includePermits: true
      })

      expect(estimate.permits).toBeGreaterThan(0)
    })

    test('should apply contingency percentage', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 },
        contingency: 0.15 // 15%
      })

      expect(estimate.contingency).toBe(estimate.subtotal * 0.15)
      expect(estimate.total).toBe(estimate.subtotal + estimate.contingency)
    })

    test('should break down by CSI division', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 },
        breakdownBy: 'csi'
      })

      expect(estimate.breakdown).toHaveProperty('division03') // Concrete
      expect(estimate.breakdown).toHaveProperty('division06') // Wood & Plastics
      expect(estimate.breakdown).toHaveProperty('division09') // Finishes
    })

    test('should break down by room', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: {
          rooms: [
            { name: 'Kitchen', area: 150 },
            { name: 'Living Room', area: 300 },
            { name: 'Master Bedroom', area: 200 }
          ]
        },
        breakdownBy: 'room'
      })

      expect(estimate.breakdown.kitchen).toBeDefined()
      expect(estimate.breakdown.livingRoom).toBeDefined()
      expect(estimate.breakdown.masterBedroom).toBeDefined()
    })
  })

  describe('Cost Comparison', () => {
    test('should compare different material options', async () => {
      const comparison = await service.compareMaterialOptions({
        projectId: 'project-123',
        zipCode: '90210',
        category: 'flooring',
        options: ['hardwood', 'laminate', 'tile'],
        area: 1000
      })

      expect(comparison).toHaveLength(3)
      expect(comparison[0]).toHaveProperty('option')
      expect(comparison[0]).toHaveProperty('cost')
      expect(comparison[0]).toHaveProperty('durability')
      expect(comparison[0]).toHaveProperty('maintenance')
    })

    test('should rank options by cost', async () => {
      const comparison = await service.compareMaterialOptions({
        projectId: 'project-123',
        zipCode: '90210',
        category: 'countertops',
        options: ['granite', 'quartz', 'laminate'],
        sortBy: 'cost'
      })

      expect(comparison[0].cost).toBeLessThan(comparison[1].cost)
      expect(comparison[1].cost).toBeLessThan(comparison[2].cost)
    })

    test('should calculate ROI for upgrades', async () => {
      const roi = await service.calculateUpgradeROI({
        projectId: 'project-123',
        upgrade: 'energyEfficientWindows',
        cost: 15000,
        zipCode: '90210'
      })

      expect(roi).toHaveProperty('yearlySavings')
      expect(roi).toHaveProperty('paybackPeriod')
      expect(roi).toHaveProperty('thirtyYearValue')
    })
  })

  describe('Estimate Accuracy', () => {
    test('should provide confidence intervals', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 },
        includeConfidenceInterval: true
      })

      expect(estimate.confidence).toHaveProperty('low')
      expect(estimate.confidence).toHaveProperty('mid')
      expect(estimate.confidence).toHaveProperty('high')
      expect(estimate.confidence.low).toBeLessThan(estimate.confidence.mid)
      expect(estimate.confidence.mid).toBeLessThan(estimate.confidence.high)
    })

    test('should track estimate vs actual costs', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 }
      })

      await service.recordActualCost('project-123', {
        category: 'framing',
        estimated: 25000,
        actual: 27500
      })

      const variance = await service.getVarianceAnalysis('project-123')
      expect(variance.framing.variance).toBe(2500)
      expect(variance.framing.percentVariance).toBeCloseTo(10, 1)
    })
  })

  describe('Schedule of Values', () => {
    test('should generate schedule of values', async () => {
      const sov = await service.generateScheduleOfValues({
        projectId: 'project-123',
        estimateId: 'est-456',
        paymentSchedule: 'monthly'
      })

      expect(sov).toHaveProperty('lineItems')
      expect(sov).toHaveProperty('totalValue')
      expect(sov.lineItems.length).toBeGreaterThan(0)
    })

    test('should support progress billing', async () => {
      const sov = await service.generateScheduleOfValues({
        projectId: 'project-123',
        estimateId: 'est-456',
        paymentSchedule: 'progress'
      })

      sov.lineItems.forEach(item => {
        expect(item).toHaveProperty('percentComplete')
        expect(item).toHaveProperty('previouslyBilled')
        expect(item).toHaveProperty('currentBilling')
      })
    })
  })

  describe('Export Formats', () => {
    test('should export to CSV', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 }
      })

      const csv = await service.exportEstimate(estimate.id, 'csv')

      expect(csv).toContain('Category,Quantity,Unit,Unit Cost,Total')
      expect(csv).toContain('Framing')
      expect(csv).toContain('Drywall')
    })

    test('should export to Excel', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 }
      })

      const excel = await service.exportEstimate(estimate.id, 'xlsx')

      expect(excel).toBeInstanceOf(Buffer)
      expect(excel.length).toBeGreaterThan(0)
    })

    test('should export to PDF', async () => {
      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 }
      })

      const pdf = await service.exportEstimate(estimate.id, 'pdf')

      expect(pdf).toBeInstanceOf(Buffer)
      expect(pdf.toString('utf8', 0, 4)).toBe('%PDF')
    })
  })

  describe('Historical Data', () => {
    test('should track cost trends over time', async () => {
      const trends = await service.getCostTrends({
        zipCode: '90210',
        category: 'lumber',
        startDate: '2023-01-01',
        endDate: '2024-01-01'
      })

      expect(trends.data).toBeDefined()
      expect(trends.data.length).toBeGreaterThan(0)
      expect(trends).toHaveProperty('percentChange')
    })

    test('should predict future costs', async () => {
      const prediction = await service.predictFutureCost({
        zipCode: '90210',
        category: 'lumber',
        monthsAhead: 6
      })

      expect(prediction).toHaveProperty('predictedCost')
      expect(prediction).toHaveProperty('confidence')
      expect(prediction.confidence).toBeGreaterThan(0)
      expect(prediction.confidence).toBeLessThan(1)
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid zip code', async () => {
      await expect(
        service.getRegionalPricing('99999')
      ).rejects.toThrow('Invalid zip code')
    })

    test('should handle missing model data', async () => {
      await expect(
        service.generateEstimate({
          projectId: 'project-123',
          zipCode: '90210',
          model: null as any
        })
      ).rejects.toThrow('Model data required')
    })

    test('should handle API failures gracefully', async () => {
      // Simulate API failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: { squareFootage: 2000 },
        fallbackToCache: true
      })

      expect(estimate).toBeDefined()
      expect(estimate.usingCachedPrices).toBe(true)
    })
  })

  describe('Integration with Other Services', () => {
    test('should use AI-parsed dimensions', async () => {
      const aiData = {
        walls: [
          { length: 20, height: 8 },
          { length: 15, height: 8 }
        ],
        extractedFrom: 'ai-parsing'
      }

      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: aiData
      })

      expect(estimate.dataSource).toBe('ai-parsing')
      expect(estimate.confidence).toBeGreaterThan(0.8)
    })

    test('should integrate with BIM model', async () => {
      const bimModel = {
        sourceFormat: 'ifc',
        materials: {
          concrete: { volume: 100, unit: 'cubic_yards' },
          steel: { weight: 50000, unit: 'pounds' }
        }
      }

      const estimate = await service.generateEstimate({
        projectId: 'project-123',
        zipCode: '90210',
        model: bimModel
      })

      expect(estimate.materials.concrete).toBeDefined()
      expect(estimate.materials.steel).toBeDefined()
    })
  })
})
