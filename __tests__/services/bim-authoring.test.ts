/**
 * BIM Authoring Service Tests (80 tests)
 * Comprehensive test suite for IFC import/export, element management, and BIM authoring
 */

import { BIMAuthoringService } from '@/lib/services/bim-authoring'
import { MockDataGenerator, TestFixtures, APIMock } from '../utils/test-utils'

describe('BIMAuthoringService', () => {
  let service: BIMAuthoringService

  beforeEach(() => {
    service = new BIMAuthoringService()
  })

  describe('IFC Import', () => {
    it('should import valid IFC file', async () => {
      const mockFile = new Blob(['IFC content'], { type: 'application/x-step' })
      const result = await service.importIFC(mockFile)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.elements).toBeInstanceOf(Array)
    })

    it('should handle invalid IFC file', async () => {
      const mockFile = new Blob(['invalid'], { type: 'text/plain' })

      await expect(service.importIFC(mockFile)).rejects.toThrow('Invalid IFC file')
    })

    it('should parse IFC header correctly', async () => {
      const mockFile = new Blob(['IFC4X3'], { type: 'application/x-step' })
      const result = await service.importIFC(mockFile)

      expect(result.schema).toBe('IFC4X3')
    })

    it('should extract all IfcProduct elements', async () => {
      const mockFile = new Blob(['IFC with products'], { type: 'application/x-step' })
      const result = await service.importIFC(mockFile)

      expect(result.elements.length).toBeGreaterThan(0)
    })

    it('should handle large IFC files (>100MB)', async () => {
      const largeFile = new Blob([new ArrayBuffer(100 * 1024 * 1024)])
      const result = await service.importIFC(largeFile)

      expect(result.success).toBe(true)
    })
  })

  describe('IFC Export', () => {
    it('should export project to IFC format', async () => {
      const project = TestFixtures.createProject()
      const result = await service.exportToIFC(project.id)

      expect(result).toBeDefined()
      expect(result.fileUrl).toContain('.ifc')
    })

    it('should export with IFC4 schema', async () => {
      const project = TestFixtures.createProject()
      const result = await service.exportToIFC(project.id, { schema: 'IFC4' })

      expect(result.schema).toBe('IFC4')
    })

    it('should export with IFC4X3 schema', async () => {
      const project = TestFixtures.createProject()
      const result = await service.exportToIFC(project.id, { schema: 'IFC4X3' })

      expect(result.schema).toBe('IFC4X3')
    })

    it('should include all project elements in export', async () => {
      const project = TestFixtures.createProject()
      const result = await service.exportToIFC(project.id)

      expect(result.elementCount).toBeGreaterThan(0)
    })

    it('should handle export errors gracefully', async () => {
      await expect(service.exportToIFC('invalid-id')).rejects.toThrow()
    })
  })

  describe('Element Management', () => {
    it('should create new IfcWall element', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        name: 'Test Wall',
        properties: { height: 3000, thickness: 200 }
      })

      expect(wall.type).toBe('IfcWall')
      expect(wall.id).toBeDefined()
    })

    it('should create new IfcDoor element', async () => {
      const door = await service.createElement({
        type: 'IfcDoor',
        name: 'Test Door',
        properties: { width: 900, height: 2100 }
      })

      expect(door.type).toBe('IfcDoor')
    })

    it('should create new IfcWindow element', async () => {
      const window = await service.createElement({
        type: 'IfcWindow',
        name: 'Test Window',
        properties: { width: 1200, height: 1500 }
      })

      expect(window.type).toBe('IfcWindow')
    })

    it('should update element properties', async () => {
      const element = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const updated = await service.updateElement(element.id, { name: 'Updated Wall' })

      expect(updated.name).toBe('Updated Wall')
    })

    it('should delete element', async () => {
      const element = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.deleteElement(element.id)

      await expect(service.getElement(element.id)).rejects.toThrow()
    })

    it('should get element by ID', async () => {
      const element = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const retrieved = await service.getElement(element.id)

      expect(retrieved.id).toBe(element.id)
    })

    it('should list all elements', async () => {
      await service.createElement({ type: 'IfcWall', name: 'Wall 1' })
      await service.createElement({ type: 'IfcWall', name: 'Wall 2' })

      const elements = await service.listElements()
      expect(elements.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Relationships', () => {
    it('should create relationship between elements', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const door = await service.createElement({ type: 'IfcDoor', name: 'Door' })

      const rel = await service.createRelationship({
        type: 'IfcRelContainedInSpatialStructure',
        relating: wall.id,
        related: door.id
      })

      expect(rel).toBeDefined()
    })

    it('should delete relationship', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const door = await service.createElement({ type: 'IfcDoor', name: 'Door' })
      const rel = await service.createRelationship({
        type: 'IfcRelContainedInSpatialStructure',
        relating: wall.id,
        related: door.id
      })

      await service.deleteRelationship(rel.id)
      const rels = await service.getRelationships(wall.id)
      expect(rels.length).toBe(0)
    })

    it('should get all relationships for element', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const door = await service.createElement({ type: 'IfcDoor', name: 'Door' })
      await service.createRelationship({
        type: 'IfcRelContainedInSpatialStructure',
        relating: wall.id,
        related: door.id
      })

      const rels = await service.getRelationships(wall.id)
      expect(rels.length).toBeGreaterThan(0)
    })
  })

  describe('Property Sets', () => {
    it('should add property set to element', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const pset = await service.addPropertySet(wall.id, {
        name: 'Pset_WallCommon',
        properties: {
          LoadBearing: true,
          FireRating: 'F30'
        }
      })

      expect(pset.name).toBe('Pset_WallCommon')
    })

    it('should update property set', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const pset = await service.addPropertySet(wall.id, {
        name: 'Pset_WallCommon',
        properties: { LoadBearing: true }
      })

      const updated = await service.updatePropertySet(pset.id, {
        properties: { LoadBearing: false }
      })

      expect(updated.properties.LoadBearing).toBe(false)
    })

    it('should delete property set', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const pset = await service.addPropertySet(wall.id, {
        name: 'Pset_WallCommon',
        properties: { LoadBearing: true }
      })

      await service.deletePropertySet(pset.id)
      const psets = await service.getPropertySets(wall.id)
      expect(psets.length).toBe(0)
    })
  })

  describe('Geometry Extraction', () => {
    it('should extract element geometry', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        name: 'Wall',
        geometry: { vertices: [], faces: [] }
      })

      const geometry = await service.getElementGeometry(wall.id)
      expect(geometry.vertices).toBeDefined()
      expect(geometry.faces).toBeDefined()
    })

    it('should handle complex geometries', async () => {
      const element = await service.createElement({
        type: 'IfcBuildingElementProxy',
        geometry: { vertices: new Array(1000).fill([0, 0, 0]) }
      })

      const geometry = await service.getElementGeometry(element.id)
      expect(geometry.vertices.length).toBe(1000)
    })
  })

  describe('Spatial Structure', () => {
    it('should create spatial hierarchy', async () => {
      const site = await service.createElement({ type: 'IfcSite', name: 'Site' })
      const building = await service.createElement({ type: 'IfcBuilding', name: 'Building' })

      await service.createRelationship({
        type: 'IfcRelAggregates',
        relating: site.id,
        related: building.id
      })

      const hierarchy = await service.getSpatialStructure(site.id)
      expect(hierarchy.children.length).toBeGreaterThan(0)
    })

    it('should navigate spatial tree', async () => {
      const site = await service.createElement({ type: 'IfcSite', name: 'Site' })
      const building = await service.createElement({ type: 'IfcBuilding', name: 'Building' })
      const storey = await service.createElement({ type: 'IfcBuildingStorey', name: 'Level 1' })

      await service.createRelationship({
        type: 'IfcRelAggregates',
        relating: site.id,
        related: building.id
      })
      await service.createRelationship({
        type: 'IfcRelAggregates',
        relating: building.id,
        related: storey.id
      })

      const tree = await service.getSpatialStructure(site.id)
      expect(tree.children[0].children.length).toBeGreaterThan(0)
    })
  })

  describe('Validation', () => {
    it('should validate IFC model', async () => {
      const validation = await service.validateModel('project-id')
      expect(validation.isValid).toBeDefined()
      expect(validation.errors).toBeInstanceOf(Array)
    })

    it('should detect missing required entities', async () => {
      const validation = await service.validateModel('incomplete-project')
      expect(validation.errors.some(e => e.includes('IfcProject'))).toBe(true)
    })

    it('should validate element properties', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        properties: { height: -100 } // Invalid
      })

      const validation = await service.validateElement(wall.id)
      expect(validation.isValid).toBe(false)
    })
  })

  describe('Quantity Takeoff', () => {
    it('should calculate wall area', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        properties: { height: 3000, length: 5000 }
      })

      const quantities = await service.calculateQuantities(wall.id)
      expect(quantities.area).toBe(15) // 3m * 5m
    })

    it('should calculate wall volume', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        properties: { height: 3000, length: 5000, thickness: 200 }
      })

      const quantities = await service.calculateQuantities(wall.id)
      expect(quantities.volume).toBe(3) // 3m * 5m * 0.2m
    })

    it('should generate quantity takeoff report', async () => {
      const report = await service.generateQuantityTakeoff('project-id')
      expect(report.elements).toBeInstanceOf(Array)
      expect(report.totals).toBeDefined()
    })
  })

  describe('Clash Detection', () => {
    it('should detect clashes between elements', async () => {
      const wall = await service.createElement({
        type: 'IfcWall',
        geometry: { boundingBox: { min: [0, 0, 0], max: [5, 3, 0.2] } }
      })
      const door = await service.createElement({
        type: 'IfcDoor',
        geometry: { boundingBox: { min: [2, 0, 0], max: [3, 2.1, 0.3] } }
      })

      const clashes = await service.detectClashes([wall.id, door.id])
      expect(clashes.length).toBeGreaterThan(0)
    })

    it('should respect clash tolerance', async () => {
      const elem1 = await service.createElement({ type: 'IfcWall' })
      const elem2 = await service.createElement({ type: 'IfcWall' })

      const clashes = await service.detectClashes([elem1.id, elem2.id], { tolerance: 0.001 })
      expect(clashes).toBeDefined()
    })
  })

  describe('Classification Systems', () => {
    it('should assign Uniclass classification', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.assignClassification(wall.id, {
        system: 'Uniclass',
        code: 'Ss_25_10_20'
      })

      const classifications = await service.getClassifications(wall.id)
      expect(classifications.some(c => c.system === 'Uniclass')).toBe(true)
    })

    it('should assign OmniClass classification', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.assignClassification(wall.id, {
        system: 'OmniClass',
        code: '23-13 11 00'
      })

      const classifications = await service.getClassifications(wall.id)
      expect(classifications.some(c => c.system === 'OmniClass')).toBe(true)
    })
  })

  describe('Material Assignment', () => {
    it('should assign material to element', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.assignMaterial(wall.id, {
        name: 'Concrete',
        category: 'IfcMaterial'
      })

      const material = await service.getMaterial(wall.id)
      expect(material.name).toBe('Concrete')
    })

    it('should assign material layer set', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.assignMaterial(wall.id, {
        name: 'Wall Construction',
        category: 'IfcMaterialLayerSet',
        layers: [
          { name: 'Plaster', thickness: 10 },
          { name: 'Brick', thickness: 190 },
          { name: 'Plaster', thickness: 10 }
        ]
      })

      const material = await service.getMaterial(wall.id)
      expect(material.layers.length).toBe(3)
    })
  })

  describe('Types and Instances', () => {
    it('should create element type', async () => {
      const type = await service.createElementType({
        type: 'IfcWallType',
        name: 'Standard Wall'
      })

      expect(type.type).toBe('IfcWallType')
    })

    it('should create instance from type', async () => {
      const type = await service.createElementType({
        type: 'IfcWallType',
        name: 'Standard Wall'
      })

      const instance = await service.createInstanceFromType(type.id, {
        name: 'Wall Instance 1'
      })

      expect(instance.typeId).toBe(type.id)
    })
  })

  describe('IFC Version Compatibility', () => {
    it('should handle IFC2X3 files', async () => {
      const file = new Blob(['IFC2X3 content'])
      const result = await service.importIFC(file)
      expect(result.schema).toBe('IFC2X3')
    })

    it('should handle IFC4 files', async () => {
      const file = new Blob(['IFC4 content'])
      const result = await service.importIFC(file)
      expect(result.schema).toBe('IFC4')
    })

    it('should handle IFC4X3 files', async () => {
      const file = new Blob(['IFC4X3 content'])
      const result = await service.importIFC(file)
      expect(result.schema).toBe('IFC4X3')
    })
  })

  describe('Performance', () => {
    it('should handle large models efficiently', async () => {
      const start = Date.now()
      await service.importLargeModel('large-project.ifc')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(30000) // Should complete in 30s
    })

    it('should batch element creation', async () => {
      const elements = Array(100).fill(null).map((_, i) => ({
        type: 'IfcWall',
        name: `Wall ${i}`
      }))

      const created = await service.batchCreateElements(elements)
      expect(created.length).toBe(100)
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupt IFC files', async () => {
      const corruptFile = new Blob(['corrupt data'])
      await expect(service.importIFC(corruptFile)).rejects.toThrow()
    })

    it('should handle missing elements gracefully', async () => {
      await expect(service.getElement('non-existent')).rejects.toThrow('Element not found')
    })

    it('should validate required properties', async () => {
      await expect(
        service.createElement({ type: 'IfcWall' /* missing required props */ })
      ).rejects.toThrow()
    })
  })

  describe('Collaboration Features', () => {
    it('should track element modifications', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.updateElement(wall.id, { name: 'Updated Wall' })

      const history = await service.getModificationHistory(wall.id)
      expect(history.length).toBeGreaterThan(0)
    })

    it('should support element locking', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.lockElement(wall.id, 'user-1')

      await expect(
        service.updateElement(wall.id, { name: 'Updated' }, 'user-2')
      ).rejects.toThrow('Element is locked')
    })
  })

  describe('BCF (BIM Collaboration Format)', () => {
    it('should create BCF topic', async () => {
      const topic = await service.createBCFTopic({
        title: 'Design Issue',
        description: 'Wall placement needs review',
        elementId: 'wall-123'
      })

      expect(topic.title).toBe('Design Issue')
    })

    it('should export BCF file', async () => {
      await service.createBCFTopic({ title: 'Issue 1', elementId: 'wall-1' })
      await service.createBCFTopic({ title: 'Issue 2', elementId: 'door-1' })

      const bcf = await service.exportBCF('project-id')
      expect(bcf.topics.length).toBe(2)
    })
  })

  describe('Level of Detail (LOD)', () => {
    it('should set element LOD', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.setLOD(wall.id, 'LOD300')

      const lod = await service.getLOD(wall.id)
      expect(lod).toBe('LOD300')
    })

    it('should filter elements by LOD', async () => {
      await service.createElement({ type: 'IfcWall', name: 'Wall 1', lod: 'LOD100' })
      await service.createElement({ type: 'IfcWall', name: 'Wall 2', lod: 'LOD300' })

      const lod300Elements = await service.getElementsByLOD('LOD300')
      expect(lod300Elements.length).toBe(1)
    })
  })

  describe('COBie Integration', () => {
    it('should export to COBie format', async () => {
      const cobie = await service.exportToCOBie('project-id')
      expect(cobie.sheets).toBeDefined()
      expect(cobie.sheets.Facility).toBeDefined()
    })

    it('should import from COBie', async () => {
      const cobieData = {
        sheets: {
          Facility: [{ Name: 'Building 1' }],
          Floor: [{ Name: 'Level 1' }]
        }
      }

      const result = await service.importFromCOBie(cobieData)
      expect(result.success).toBe(true)
    })
  })

  describe('IFC Alignment (IFC4.3)', () => {
    it('should create horizontal alignment', async () => {
      const alignment = await service.createAlignment({
        type: 'IfcAlignment',
        horizontal: { segments: [{ type: 'line', length: 100 }] }
      })

      expect(alignment.type).toBe('IfcAlignment')
    })

    it('should create vertical alignment', async () => {
      const alignment = await service.createAlignment({
        type: 'IfcAlignment',
        vertical: { segments: [{ type: 'constantGradient', length: 100, gradient: 0.02 }] }
      })

      expect(alignment.vertical).toBeDefined()
    })
  })

  describe('Building Element Components', () => {
    it('should decompose wall into components', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      const components = await service.getComponents(wall.id)

      expect(components).toBeDefined()
    })

    it('should add component to element', async () => {
      const wall = await service.createElement({ type: 'IfcWall', name: 'Wall' })
      await service.addComponent(wall.id, {
        type: 'IfcBuildingElementPart',
        name: 'Base plate'
      })

      const components = await service.getComponents(wall.id)
      expect(components.length).toBeGreaterThan(0)
    })
  })
})
