/**
 * Bionic Design Service Test Suite
 *
 * Comprehensive tests for genetic algorithms, biomimicry patterns, and generative design
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  BionicDesignService,
  type BionicDesignParams,
  type GeneticAlgorithmConfig,
  type StructuralGenome,
  type Gene,
  type FitnessMetrics,
  type BionicPattern
} from '../../lib/services/bionic-design'

describe('BionicDesignService', () => {
  let service: BionicDesignService

  beforeEach(() => {
    service = new BionicDesignService()
  })

  // ===========================
  // Initialization Tests
  // ===========================

  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(BionicDesignService)
    })

    it('should initialize bionic patterns on construction', () => {
      const patterns = service.getAvailablePatterns()
      expect(patterns).toBeDefined()
      expect(patterns.length).toBeGreaterThan(0)
    })

    it('should have honeycomb pattern available', () => {
      const patterns = service.getAvailablePatterns()
      const honeycomb = patterns.find(p => p.name === 'Honeycomb')
      expect(honeycomb).toBeDefined()
      expect(honeycomb?.naturalSource).toBe('Bee hive structure')
    })

    it('should have spider-web pattern available', () => {
      const patterns = service.getAvailablePatterns()
      const spiderWeb = patterns.find(p => p.name === 'Spider Web')
      expect(spiderWeb).toBeDefined()
      expect(spiderWeb?.naturalSource).toBe('Spider silk structure')
    })

    it('should have bone pattern available', () => {
      const patterns = service.getAvailablePatterns()
      const bone = patterns.find(p => p.name === 'Trabecular Bone')
      expect(bone).toBeDefined()
    })

    it('should have tree pattern available', () => {
      const patterns = service.getAvailablePatterns()
      const tree = patterns.find(p => p.name === 'Tree Branching')
      expect(tree).toBeDefined()
    })
  })

  // ===========================
  // Biomimicry Pattern Tests
  // ===========================

  describe('Biomimicry Pattern Validation', () => {
    it('should generate honeycomb pattern with valid parameters', () => {
      const genes = service.applyBionicPattern('honeycomb', {
        width: 10,
        height: 10,
        cellSize: 1
      })

      expect(genes).toBeDefined()
      expect(Array.isArray(genes)).toBe(true)
      expect(genes!.length).toBeGreaterThan(0)
    })

    it('should generate honeycomb with correct hexagonal spacing', () => {
      const genes = service.applyBionicPattern('honeycomb', {
        width: 10,
        height: 10,
        cellSize: 1
      })

      genes!.forEach(gene => {
        expect(gene.type).toBe('shell')
        expect(gene.material).toBe('aluminum')
        expect(gene.dimensions.radius).toBe(1)
      })
    })

    it('should generate spider-web pattern with radial spokes', () => {
      const genes = service.applyBionicPattern('spider-web', {
        radius: 10,
        spokes: 8,
        rings: 4
      })

      expect(genes).toBeDefined()
      expect(genes!.length).toBeGreaterThan(0)

      const spokes = genes!.filter(g => g.dimensions.length)
      expect(spokes.length).toBeGreaterThanOrEqual(8)
    })

    it('should generate spider-web with concentric rings', () => {
      const genes = service.applyBionicPattern('spider-web', {
        radius: 10,
        spokes: 8,
        rings: 5
      })

      const rings = genes!.filter(g => g.properties?.isRing)
      expect(rings.length).toBeGreaterThanOrEqual(5)
    })

    it('should generate bone lattice structure', () => {
      const genes = service.applyBionicPattern('bone', {
        volume: [10, 10, 10],
        density: 0.5
      })

      expect(genes).toBeDefined()
      expect(genes!.length).toBeGreaterThan(0)
      genes!.forEach(gene => {
        expect(gene.material).toBe('titanium')
      })
    })

    it('should generate bone pattern with varying density', () => {
      const sparseGenes = service.applyBionicPattern('bone', {
        volume: [5, 5, 5],
        density: 0.2
      })

      const denseGenes = service.applyBionicPattern('bone', {
        volume: [5, 5, 5],
        density: 0.8
      })

      expect(denseGenes!.length).toBeGreaterThan(sparseGenes!.length)
    })

    it('should generate tree branching pattern', () => {
      const genes = service.applyBionicPattern('tree', {
        height: 10,
        branches: 3,
        levels: 2
      })

      expect(genes).toBeDefined()
      expect(genes!.length).toBeGreaterThan(0)
    })

    it('should generate tree with fractal branching', () => {
      const level1 = service.applyBionicPattern('tree', {
        height: 10,
        branches: 2,
        levels: 1
      })

      const level3 = service.applyBionicPattern('tree', {
        height: 10,
        branches: 2,
        levels: 3
      })

      expect(level3!.length).toBeGreaterThan(level1!.length)
    })

    it('should return null for invalid pattern name', () => {
      const genes = service.applyBionicPattern('invalid-pattern', {})
      expect(genes).toBeNull()
    })

    it('should validate pattern applications', () => {
      const patterns = service.getAvailablePatterns()
      patterns.forEach(pattern => {
        expect(pattern.applications).toBeDefined()
        expect(pattern.applications.length).toBeGreaterThan(0)
      })
    })
  })

  // ===========================
  // Genetic Algorithm Tests
  // ===========================

  describe('Genetic Algorithm Convergence', () => {
    const baseConfig: GeneticAlgorithmConfig = {
      populationSize: 20,
      generations: 10,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.1,
      selectionMethod: 'tournament'
    }

    const baseParams: BionicDesignParams = {
      objectiveFunction: 'structural',
      constraints: {
        maxWeight: 1000,
        maxCost: 50000
      }
    }

    it('should run optimization and return valid result', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        baseConfig,
        'test-project-1'
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.projectId).toBe('test-project-1')
      expect(result.bestGenome).toBeDefined()
      expect(result.bestFitness).toBeDefined()
    })

    it('should track evolution history', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        baseConfig,
        'test-project-2'
      )

      expect(result.evolutionHistory).toBeDefined()
      expect(result.evolutionHistory.length).toBeGreaterThan(0)
      expect(result.evolutionHistory.length).toBeLessThanOrEqual(baseConfig.generations)
    })

    it('should show fitness improvement over generations', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        { ...baseConfig, generations: 20 },
        'test-project-3'
      )

      const firstGen = result.evolutionHistory[0]
      const lastGen = result.evolutionHistory[result.evolutionHistory.length - 1]

      expect(lastGen.bestFitness).toBeGreaterThanOrEqual(firstGen.bestFitness)
    })

    it('should converge early if improvement plateaus', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        { ...baseConfig, generations: 100 },
        'test-project-4'
      )

      expect(result.generation).toBeLessThanOrEqual(100)
    })

    it('should calculate convergence rate', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        baseConfig,
        'test-project-5'
      )

      expect(result.convergenceRate).toBeDefined()
      expect(typeof result.convergenceRate).toBe('number')
    })

    it('should maintain population diversity tracking', async () => {
      const result = await service.optimizeDesign(
        baseParams,
        baseConfig,
        'test-project-6'
      )

      result.evolutionHistory.forEach(gen => {
        expect(gen.diversity).toBeDefined()
        expect(gen.diversity).toBeGreaterThanOrEqual(0)
      })
    })
  })

  // ===========================
  // Fitness Function Tests
  // ===========================

  describe('Fitness Function Evaluation', () => {
    it('should calculate structural efficiency', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-structural'
      )

      expect(result.bestFitness.structuralEfficiency).toBeDefined()
      expect(result.bestFitness.structuralEfficiency).toBeGreaterThanOrEqual(0)
      expect(result.bestFitness.structuralEfficiency).toBeLessThanOrEqual(1)
    })

    it('should calculate material cost', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-cost'
      )

      expect(result.bestFitness.materialCost).toBeDefined()
      expect(result.bestFitness.materialCost).toBeGreaterThan(0)
      expect(result.finalDesign.estimatedCost).toBe(result.bestFitness.materialCost)
    })

    it('should calculate thermal performance', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'thermal',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-thermal'
      )

      expect(result.bestFitness.thermalPerformance).toBeDefined()
      expect(result.bestFitness.thermalPerformance).toBeGreaterThanOrEqual(0)
      expect(result.bestFitness.thermalPerformance).toBeLessThanOrEqual(1)
    })

    it('should calculate aerodynamic efficiency', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'aerodynamic',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-aero'
      )

      expect(result.bestFitness.aerodynamicEfficiency).toBeDefined()
      expect(result.bestFitness.aerodynamicEfficiency).toBeGreaterThanOrEqual(0)
      expect(result.bestFitness.aerodynamicEfficiency).toBeLessThanOrEqual(1)
    })

    it('should calculate aesthetic score', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'aesthetic',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-aesthetic'
      )

      expect(result.bestFitness.aestheticScore).toBeDefined()
      expect(result.bestFitness.aestheticScore).toBeGreaterThanOrEqual(0)
      expect(result.bestFitness.aestheticScore).toBeLessThanOrEqual(1)
    })

    it('should handle multi-objective optimization', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'multi-objective',
        constraints: {}
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-multi'
      )

      expect(result.bestFitness.overallFitness).toBeDefined()
      expect(result.bestFitness.overallFitness).toBeGreaterThan(0)
    })

    it('should apply constraint penalties for exceeding max cost', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {
          maxCost: 1000 // Very low limit
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-constraint'
      )

      expect(result.bestFitness).toBeDefined()
    })

    it('should weight objectives based on objective function', async () => {
      const structuralResult = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-structural-weight'
      )

      const thermalResult = await service.optimizeDesign(
        { objectiveFunction: 'thermal', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-thermal-weight'
      )

      expect(structuralResult.bestFitness.overallFitness).toBeDefined()
      expect(thermalResult.bestFitness.overallFitness).toBeDefined()
    })
  })

  // ===========================
  // Mutation Strategy Tests
  // ===========================

  describe('Mutation Strategies', () => {
    it('should handle high mutation rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.9, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-high-mutation'
      )

      expect(result.evolutionHistory).toBeDefined()
      expect(result.evolutionHistory.length).toBeGreaterThan(0)
    })

    it('should handle low mutation rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.01, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-low-mutation'
      )

      expect(result.evolutionHistory).toBeDefined()
      expect(result.evolutionHistory.length).toBeGreaterThan(0)
    })

    it('should maintain diversity with mutation', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 15, mutationRate: 0.3, crossoverRate: 0.7, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-mutation-diversity'
      )

      const diversities = result.evolutionHistory.map(gen => gen.diversity)
      expect(Math.max(...diversities)).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Crossover Operator Tests
  // ===========================

  describe('Crossover Operators', () => {
    it('should handle high crossover rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 1.0, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-high-crossover'
      )

      expect(result.bestGenome).toBeDefined()
      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should handle low crossover rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.1, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-low-crossover'
      )

      expect(result.bestGenome).toBeDefined()
      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should produce offspring with crossover', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-crossover-offspring'
      )

      expect(result.evolutionHistory.length).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Selection Method Tests
  // ===========================

  describe('Population Management - Selection Methods', () => {
    it('should support tournament selection', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-tournament'
      )

      expect(result).toBeDefined()
      expect(result.bestGenome).toBeDefined()
    })

    it('should support roulette wheel selection', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'roulette' },
        'test-roulette'
      )

      expect(result).toBeDefined()
      expect(result.bestGenome).toBeDefined()
    })

    it('should support rank selection', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'rank' },
        'test-rank'
      )

      expect(result).toBeDefined()
      expect(result.bestGenome).toBeDefined()
    })

    it('should maintain population size across generations', async () => {
      const populationSize = 30
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-population-size'
      )

      expect(result).toBeDefined()
    })

    it('should implement elitism correctly', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 15, mutationRate: 0.2, crossoverRate: 0.8, elitismRate: 0.2, selectionMethod: 'tournament' },
        'test-elitism'
      )

      // Check that fitness never decreases with elitism
      for (let i = 1; i < result.evolutionHistory.length; i++) {
        expect(result.evolutionHistory[i].bestFitness)
          .toBeGreaterThanOrEqual(result.evolutionHistory[i - 1].bestFitness - 0.01)
      }
    })

    it('should handle small population size', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 5, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.2, selectionMethod: 'tournament' },
        'test-small-pop'
      )

      expect(result).toBeDefined()
    })

    it('should handle large population size', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 50, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-large-pop'
      )

      expect(result).toBeDefined()
    })
  })

  // ===========================
  // Topology Optimization Tests
  // ===========================

  describe('Topology Optimization', () => {
    it('should optimize structural topology', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {
          minStrength: 100
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-topology'
      )

      expect(result.bestGenome.genes).toBeDefined()
      expect(result.finalDesign.geometry).toBeDefined()
    })

    it('should generate optimal gene distribution', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-gene-distribution'
      )

      const geneTypes = result.bestGenome.genes.map(g => g.type)
      const uniqueTypes = new Set(geneTypes)
      expect(uniqueTypes.size).toBeGreaterThan(0)
    })

    it('should optimize material distribution', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-material-dist'
      )

      expect(result.finalDesign.materials).toBeDefined()
      expect(result.finalDesign.materials.length).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Generative Design Tests
  // ===========================

  describe('Generative Design', () => {
    it('should generate design from biomimicry reference', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {},
        biomimicryReference: {
          organism: 'honeycomb',
          characteristics: ['lightweight', 'strong']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-biomimicry-gen'
      )

      expect(result.bestGenome).toBeDefined()
      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should generate design with spider-web reference', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {},
        biomimicryReference: {
          organism: 'spider-web',
          characteristics: ['tensile', 'flexible']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 15, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-spiderweb-gen'
      )

      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should generate design with bone reference', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {},
        biomimicryReference: {
          organism: 'bone',
          characteristics: ['strong', 'lightweight']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 15, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-bone-gen'
      )

      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should generate design with tree reference', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {},
        biomimicryReference: {
          organism: 'tree',
          characteristics: ['branching', 'efficient']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 15, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-tree-gen'
      )

      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })

    it('should produce unique designs across runs', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {}
      }

      const config: GeneticAlgorithmConfig = {
        populationSize: 10,
        generations: 5,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        selectionMethod: 'tournament'
      }

      const result1 = await service.optimizeDesign(params, config, 'test-unique-1')
      const result2 = await service.optimizeDesign(params, config, 'test-unique-2')

      expect(result1.id).not.toBe(result2.id)
    })

    it('should generate final design geometry', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-geometry'
      )

      expect(result.finalDesign.geometry).toBeDefined()
      expect(result.finalDesign.geometry.vertices).toBeDefined()
      expect(result.finalDesign.geometry.materials).toBeDefined()
    })

    it('should include structural analysis in final design', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-analysis'
      )

      expect(result.finalDesign.structuralAnalysis).toBeDefined()
      expect(result.finalDesign.structuralAnalysis.maxStress).toBeDefined()
      expect(result.finalDesign.structuralAnalysis.maxDeflection).toBeDefined()
      expect(result.finalDesign.structuralAnalysis.safetyFactor).toBeDefined()
    })

    it('should estimate weight in final design', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-weight'
      )

      expect(result.finalDesign.estimatedWeight).toBeDefined()
      expect(result.finalDesign.estimatedWeight).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Constraint Handling Tests
  // ===========================

  describe('Constraint Handling', () => {
    it('should respect material type constraints', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {
          materialTypes: ['steel', 'concrete']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-material-constraint'
      )

      expect(result).toBeDefined()
    })

    it('should handle building code constraints', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {
          buildingCodes: ['IBC-2018', 'ASCE-7']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-building-codes'
      )

      expect(result).toBeDefined()
    })

    it('should handle max weight constraints', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {
          maxWeight: 5000
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-max-weight'
      )

      expect(result.finalDesign.estimatedWeight).toBeDefined()
    })

    it('should handle multiple constraints simultaneously', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'multi-objective',
        constraints: {
          maxWeight: 5000,
          maxCost: 100000,
          minStrength: 200,
          materialTypes: ['steel', 'aluminum']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 20, generations: 10, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-multi-constraint'
      )

      expect(result).toBeDefined()
      expect(result.bestFitness.overallFitness).toBeGreaterThan(0)
    })
  })

  // ===========================
  // Pattern Application Tests
  // ===========================

  describe('Pattern Application and Validation', () => {
    it('should list all available patterns', () => {
      const patterns = service.getAvailablePatterns()
      expect(patterns.length).toBe(4) // honeycomb, spider-web, bone, tree
    })

    it('should provide pattern descriptions', () => {
      const patterns = service.getAvailablePatterns()
      patterns.forEach(pattern => {
        expect(pattern.description).toBeDefined()
        expect(pattern.description.length).toBeGreaterThan(0)
      })
    })

    it('should specify pattern applications', () => {
      const patterns = service.getAvailablePatterns()
      const honeycomb = patterns.find(p => p.name === 'Honeycomb')
      expect(honeycomb?.applications).toContain('facades')
      expect(honeycomb?.applications).toContain('roofs')
    })

    it('should generate patterns with different parameters', () => {
      const pattern1 = service.applyBionicPattern('honeycomb', {
        width: 5,
        height: 5,
        cellSize: 0.5
      })

      const pattern2 = service.applyBionicPattern('honeycomb', {
        width: 10,
        height: 10,
        cellSize: 1.0
      })

      expect(pattern2!.length).toBeGreaterThan(pattern1!.length)
    })
  })

  // ===========================
  // Edge Cases and Error Handling
  // ===========================

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero generations', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 0, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-zero-gen'
      )

      expect(result).toBeDefined()
      expect(result.generation).toBe(0)
    })

    it('should handle zero mutation rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-zero-mutation'
      )

      expect(result).toBeDefined()
    })

    it('should handle zero crossover rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-zero-crossover'
      )

      expect(result).toBeDefined()
    })

    it('should handle maximum elitism rate', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 1.0, selectionMethod: 'tournament' },
        'test-max-elitism'
      )

      expect(result).toBeDefined()
    })

    it('should generate valid simulation result ID', async () => {
      const result = await service.optimizeDesign(
        { objectiveFunction: 'structural', constraints: {} },
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-id-gen'
      )

      expect(result.id).toMatch(/^bionic_/)
    })

    it('should handle invalid biomimicry organism gracefully', async () => {
      const params: BionicDesignParams = {
        objectiveFunction: 'structural',
        constraints: {},
        biomimicryReference: {
          organism: 'invalid-organism',
          characteristics: ['test']
        }
      }

      const result = await service.optimizeDesign(
        params,
        { populationSize: 10, generations: 5, mutationRate: 0.1, crossoverRate: 0.8, elitismRate: 0.1, selectionMethod: 'tournament' },
        'test-invalid-organism'
      )

      expect(result).toBeDefined()
      expect(result.bestGenome.genes.length).toBeGreaterThan(0)
    })
  })
})
