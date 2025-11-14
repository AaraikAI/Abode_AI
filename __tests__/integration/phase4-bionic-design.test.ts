/**
 * Integration Tests for Bionic Design Service
 */

import { BionicDesignService, BionicDesignParams, GeneticAlgorithmConfig } from '@/lib/services/bionic-design'

describe('Bionic Design Service', () => {
  let service: BionicDesignService

  beforeEach(() => {
    service = new BionicDesignService()
  })

  describe('Biomimicry Patterns', () => {
    test('should generate honeycomb pattern', () => {
      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.4,
          thermal: 0.3,
          aerodynamic: 0.2,
          aesthetic: 0.1
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel', 'concrete'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const pattern = service['bionicPatterns'].get('honeycomb')
      expect(pattern).toBeDefined()

      const result = pattern!.generatePattern(params)
      expect(result.elements).toBeDefined()
      expect(result.elements.length).toBeGreaterThan(0)
      expect(result.elements[0].type).toBe('hexagon')
    })

    test('should generate spider-web pattern', () => {
      const params: BionicDesignParams = {
        pattern: 'spider-web',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.4,
          thermal: 0.3,
          aerodynamic: 0.2,
          aesthetic: 0.1
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const pattern = service['bionicPatterns'].get('spider-web')
      expect(pattern).toBeDefined()

      const result = pattern!.generatePattern(params)
      expect(result.elements).toBeDefined()
      expect(result.elements.length).toBeGreaterThan(0)
      expect(result.elements[0].type).toBe('spiral-cable')
    })

    test('should generate bone-structure pattern', () => {
      const params: BionicDesignParams = {
        pattern: 'bone',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.5,
          thermal: 0.2,
          aerodynamic: 0.2,
          aesthetic: 0.1
        },
        constraints: {
          minStrength: 1.2,
          materialTypes: ['steel', 'concrete'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 25,
          temperature: [0, 40],
          humidity: 60,
          seismicZone: 3
        }
      }

      const pattern = service['bionicPatterns'].get('bone')
      expect(pattern).toBeDefined()

      const result = pattern!.generatePattern(params)
      expect(result.elements).toBeDefined()
      expect(result.elements.length).toBeGreaterThan(0)
      expect(result.elements[0].type).toBe('trabecular')
    })

    test('should generate tree-branching pattern', () => {
      const params: BionicDesignParams = {
        pattern: 'tree',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.3,
          thermal: 0.2,
          aerodynamic: 0.3,
          aesthetic: 0.2
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['wood', 'steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 30,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const pattern = service['bionicPatterns'].get('tree')
      expect(pattern).toBeDefined()

      const result = pattern!.generatePattern(params)
      expect(result.elements).toBeDefined()
      expect(result.elements.length).toBeGreaterThan(0)
      expect(result.elements[0].type).toBe('branch')
    })
  })

  describe('Genetic Algorithm', () => {
    test('should optimize design using genetic algorithm', async () => {
      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.4,
          thermal: 0.3,
          aerodynamic: 0.2,
          aesthetic: 0.1
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const gaConfig: GeneticAlgorithmConfig = {
        populationSize: 20,
        generations: 10,
        mutationRate: 0.1,
        crossoverRate: 0.7,
        elitismRate: 0.1,
        selectionMethod: 'tournament',
        tournamentSize: 3,
        convergenceThreshold: 0.001,
        convergenceGenerations: 5
      }

      const result = await service.optimizeDesign(params, gaConfig)

      expect(result).toBeDefined()
      expect(result.bestDesign).toBeDefined()
      expect(result.scores).toBeDefined()
      expect(result.scores.overall).toBeGreaterThan(0)
      expect(result.scores.overall).toBeLessThanOrEqual(1)
      expect(result.performanceMetrics).toBeDefined()
      expect(result.generationCount).toBeLessThanOrEqual(gaConfig.generations)
      expect(result.convergenceHistory).toBeDefined()
    }, 15000) // Longer timeout for optimization

    test('should use tournament selection', async () => {
      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 5, height: 2, depth: 5 },
        objectives: {
          structural: 0.5,
          thermal: 0.3,
          aerodynamic: 0.1,
          aesthetic: 0.1
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const gaConfig: GeneticAlgorithmConfig = {
        populationSize: 10,
        generations: 5,
        mutationRate: 0.1,
        crossoverRate: 0.7,
        elitismRate: 0.1,
        selectionMethod: 'tournament',
        tournamentSize: 3,
        convergenceThreshold: 0.001,
        convergenceGenerations: 3
      }

      const result = await service.optimizeDesign(params, gaConfig)

      expect(result.bestDesign).toBeDefined()
      expect(result.scores.overall).toBeGreaterThan(0)
    }, 10000)

    test('should detect convergence', async () => {
      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 5, height: 2, depth: 5 },
        objectives: {
          structural: 1.0,
          thermal: 0.0,
          aerodynamic: 0.0,
          aesthetic: 0.0
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const gaConfig: GeneticAlgorithmConfig = {
        populationSize: 10,
        generations: 50, // High but should converge early
        mutationRate: 0.05,
        crossoverRate: 0.8,
        elitismRate: 0.2,
        selectionMethod: 'tournament',
        tournamentSize: 3,
        convergenceThreshold: 0.001,
        convergenceGenerations: 5
      }

      const result = await service.optimizeDesign(params, gaConfig)

      // Should converge before reaching max generations
      expect(result.generationCount).toBeLessThan(gaConfig.generations)
      expect(result.convergenceHistory.length).toBeGreaterThan(0)

      const lastConvergence = result.convergenceHistory[result.convergenceHistory.length - 1]
      expect(lastConvergence.converged).toBe(true)
    }, 15000)
  })

  describe('Performance Metrics', () => {
    test('should calculate structural performance', () => {
      const design = {
        pattern: 'honeycomb',
        elements: [
          { type: 'hexagon', position: { x: 0, y: 0, z: 0 }, size: 1, material: 'steel', thickness: 0.1 }
        ]
      }

      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 1.0,
          thermal: 0.0,
          aerodynamic: 0.0,
          aesthetic: 0.0
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const score = service['calculateStructuralPerformance'](design, params)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    test('should calculate thermal performance', () => {
      const design = {
        pattern: 'honeycomb',
        elements: [
          { type: 'hexagon', position: { x: 0, y: 0, z: 0 }, size: 1, material: 'steel', thickness: 0.1 }
        ]
      }

      const params: BionicDesignParams = {
        pattern: 'honeycomb',
        dimensions: { width: 10, height: 3, depth: 10 },
        objectives: {
          structural: 0.0,
          thermal: 1.0,
          aerodynamic: 0.0,
          aesthetic: 0.0
        },
        constraints: {
          minStrength: 1.0,
          materialTypes: ['steel'],
          buildingCodes: []
        },
        environmentalFactors: {
          windSpeed: 20,
          temperature: [5, 35],
          humidity: 50,
          seismicZone: 2
        }
      }

      const score = service['calculateThermalPerformance'](design, params)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})
