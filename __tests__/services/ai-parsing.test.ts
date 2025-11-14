/**
 * AI Parsing Service Tests
 * Tests file upload, scale detection, OCR, and dimension extraction
 */

import { AIParsing } from '@/lib/services/ai-parsing'
import { createReadStream } from 'fs'
import { join } from 'path'

describe('AIParsing Service', () => {
  let service: AIParsing

  beforeEach(() => {
    service = new AIParsing()
  })

  describe('File Upload and Processing', () => {
    test('should successfully upload and parse a PDF file', async () => {
      const mockFile = Buffer.from('Mock PDF content')
      const result = await service.parseFile(mockFile, 'test-floor-plan.pdf', 'project-123')

      expect(result).toHaveProperty('fileId')
      expect(result).toHaveProperty('metadata')
      expect(result.metadata.fileName).toBe('test-floor-plan.pdf')
      expect(result.metadata.fileType).toBe('application/pdf')
    })

    test('should successfully upload and parse a DWG file', async () => {
      const mockFile = Buffer.from('Mock DWG content')
      const result = await service.parseFile(mockFile, 'test-drawing.dwg', 'project-123')

      expect(result.fileId).toBeDefined()
      expect(result.metadata.fileType).toBe('application/acad')
    })

    test('should successfully upload and parse an image file', async () => {
      const mockFile = Buffer.from('Mock PNG content')
      const result = await service.parseFile(mockFile, 'test-image.png', 'project-123')

      expect(result.fileId).toBeDefined()
      expect(result.metadata.fileType).toBe('image/png')
    })

    test('should reject unsupported file types', async () => {
      const mockFile = Buffer.from('Mock TXT content')

      await expect(
        service.parseFile(mockFile, 'test.txt', 'project-123')
      ).rejects.toThrow('Unsupported file type')
    })

    test('should reject files exceeding size limit', async () => {
      const largeFile = Buffer.alloc(101 * 1024 * 1024) // 101 MB

      await expect(
        service.parseFile(largeFile, 'large-file.pdf', 'project-123')
      ).rejects.toThrow('File size exceeds limit')
    })
  })

  describe('Scale Detection', () => {
    test('should detect scale from explicit notation (1/4" = 1\'-0")', async () => {
      const mockFile = Buffer.from('Mock PDF with scale notation')
      const result = await service.parseFile(mockFile, 'scaled-plan.pdf', 'project-123')

      expect(result.scale).toBeDefined()
      expect(result.scale?.notation).toMatch(/1\/4"/)
      expect(result.scale?.ratio).toBeCloseTo(48, 1)
    })

    test('should detect scale from text (Scale: 1:100)', async () => {
      const mockFile = Buffer.from('Mock PDF with Scale: 1:100')
      const result = await service.parseFile(mockFile, 'metric-plan.pdf', 'project-123')

      expect(result.scale).toBeDefined()
      expect(result.scale?.notation).toContain('1:100')
      expect(result.scale?.ratio).toBe(100)
    })

    test('should detect scale bar and calculate scale', async () => {
      const mockFile = Buffer.from('Mock PDF with scale bar')
      const result = await service.parseFile(mockFile, 'plan-with-scalebar.pdf', 'project-123')

      expect(result.scale).toBeDefined()
      expect(result.scale?.detectionMethod).toBe('scale_bar')
      expect(result.scale?.confidence).toBeGreaterThan(0.7)
    })

    test('should handle missing scale with lower confidence', async () => {
      const mockFile = Buffer.from('Mock PDF without scale')
      const result = await service.parseFile(mockFile, 'no-scale.pdf', 'project-123')

      expect(result.scale).toBeDefined()
      expect(result.scale?.confidence).toBeLessThan(0.5)
    })

    test('should detect imperial units correctly', async () => {
      const mockFile = Buffer.from('Mock PDF with feet and inches')
      const result = await service.parseFile(mockFile, 'imperial-plan.pdf', 'project-123')

      expect(result.scale?.unit).toBe('imperial')
    })

    test('should detect metric units correctly', async () => {
      const mockFile = Buffer.from('Mock PDF with meters')
      const result = await service.parseFile(mockFile, 'metric-plan.pdf', 'project-123')

      expect(result.scale?.unit).toBe('metric')
    })
  })

  describe('OCR and Text Extraction', () => {
    test('should extract room labels from floor plan', async () => {
      const mockFile = Buffer.from('Mock PDF with room labels')
      const result = await service.parseFile(mockFile, 'labeled-plan.pdf', 'project-123')

      expect(result.extractedText).toBeDefined()
      expect(result.extractedText?.rooms).toContain('KITCHEN')
      expect(result.extractedText?.rooms).toContain('LIVING ROOM')
      expect(result.extractedText?.rooms).toContain('BEDROOM')
    })

    test('should extract dimensions from annotations', async () => {
      const mockFile = Buffer.from('Mock PDF with dimensions')
      const result = await service.parseFile(mockFile, 'dimensioned-plan.pdf', 'project-123')

      expect(result.extractedText?.dimensions).toBeDefined()
      expect(result.extractedText?.dimensions?.length).toBeGreaterThan(0)
    })

    test('should extract title block information', async () => {
      const mockFile = Buffer.from('Mock PDF with title block')
      const result = await service.parseFile(mockFile, 'professional-plan.pdf', 'project-123')

      expect(result.extractedText?.titleBlock).toBeDefined()
      expect(result.extractedText?.titleBlock).toHaveProperty('projectName')
      expect(result.extractedText?.titleBlock).toHaveProperty('sheetNumber')
      expect(result.extractedText?.titleBlock).toHaveProperty('date')
    })

    test('should handle poor quality scans with lower confidence', async () => {
      const mockFile = Buffer.from('Mock poor quality PDF')
      const result = await service.parseFile(mockFile, 'low-quality.pdf', 'project-123')

      expect(result.ocrConfidence).toBeLessThan(0.6)
    })

    test('should extract notes and callouts', async () => {
      const mockFile = Buffer.from('Mock PDF with notes')
      const result = await service.parseFile(mockFile, 'annotated-plan.pdf', 'project-123')

      expect(result.extractedText?.notes).toBeDefined()
      expect(result.extractedText?.notes?.length).toBeGreaterThan(0)
    })
  })

  describe('Geometry Detection', () => {
    test('should detect walls from floor plan', async () => {
      const mockFile = Buffer.from('Mock PDF with walls')
      const result = await service.parseFile(mockFile, 'floor-plan.pdf', 'project-123')

      expect(result.geometry).toBeDefined()
      expect(result.geometry?.walls).toBeDefined()
      expect(result.geometry?.walls.length).toBeGreaterThan(0)
    })

    test('should detect doors and windows', async () => {
      const mockFile = Buffer.from('Mock PDF with openings')
      const result = await service.parseFile(mockFile, 'floor-plan.pdf', 'project-123')

      expect(result.geometry?.doors).toBeDefined()
      expect(result.geometry?.windows).toBeDefined()
    })

    test('should calculate room areas', async () => {
      const mockFile = Buffer.from('Mock PDF with rooms')
      const result = await service.parseFile(mockFile, 'floor-plan.pdf', 'project-123')

      expect(result.geometry?.rooms).toBeDefined()
      expect(result.geometry?.rooms[0]).toHaveProperty('area')
      expect(result.geometry?.rooms[0].area).toBeGreaterThan(0)
    })

    test('should detect structural elements', async () => {
      const mockFile = Buffer.from('Mock PDF with columns and beams')
      const result = await service.parseFile(mockFile, 'structural-plan.pdf', 'project-123')

      expect(result.geometry?.structural).toBeDefined()
      expect(result.geometry?.structural.columns).toBeDefined()
      expect(result.geometry?.structural.beams).toBeDefined()
    })
  })

  describe('3D Model Generation', () => {
    test('should generate 3D model from 2D floor plan', async () => {
      const mockFile = Buffer.from('Mock PDF floor plan')
      const parseResult = await service.parseFile(mockFile, 'floor-plan.pdf', 'project-123')

      const model3D = await service.generate3DModel(parseResult.fileId, {
        wallHeight: 9,
        includeRoof: true,
        includeFoundation: true
      })

      expect(model3D).toBeDefined()
      expect(model3D.vertices).toBeDefined()
      expect(model3D.faces).toBeDefined()
      expect(model3D.materials).toBeDefined()
    })

    test('should apply default wall height if not specified', async () => {
      const mockFile = Buffer.from('Mock PDF floor plan')
      const parseResult = await service.parseFile(mockFile, 'floor-plan.pdf', 'project-123')

      const model3D = await service.generate3DModel(parseResult.fileId)

      expect(model3D.metadata.wallHeight).toBe(8) // Default 8 feet
    })

    test('should generate multiple floors from multi-page PDF', async () => {
      const mockFile = Buffer.from('Mock multi-page PDF')
      const parseResult = await service.parseFile(mockFile, 'multi-floor.pdf', 'project-123')

      const model3D = await service.generate3DModel(parseResult.fileId, {
        floors: [
          { level: 0, height: 9 },
          { level: 1, height: 8 },
          { level: 2, height: 8 }
        ]
      })

      expect(model3D.floors).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    test('should handle corrupted PDF files', async () => {
      const corruptedFile = Buffer.from('Not a valid PDF')

      await expect(
        service.parseFile(corruptedFile, 'corrupt.pdf', 'project-123')
      ).rejects.toThrow('Failed to parse file')
    })

    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const mockFile = Buffer.from('Mock PDF')

      await expect(
        service.parseFile(mockFile, 'test.pdf', 'project-123')
      ).rejects.toThrow('Network error')
    })

    test('should handle missing project ID', async () => {
      const mockFile = Buffer.from('Mock PDF')

      await expect(
        service.parseFile(mockFile, 'test.pdf', '')
      ).rejects.toThrow('Project ID required')
    })

    test('should validate file buffer', async () => {
      await expect(
        service.parseFile(null as any, 'test.pdf', 'project-123')
      ).rejects.toThrow('Invalid file')
    })
  })

  describe('Batch Processing', () => {
    test('should process multiple files in batch', async () => {
      const files = [
        { buffer: Buffer.from('PDF 1'), name: 'plan1.pdf' },
        { buffer: Buffer.from('PDF 2'), name: 'plan2.pdf' },
        { buffer: Buffer.from('PDF 3'), name: 'plan3.pdf' }
      ]

      const results = await service.batchParseFiles(files, 'project-123')

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[2].success).toBe(true)
    })

    test('should handle partial failures in batch', async () => {
      const files = [
        { buffer: Buffer.from('Valid PDF'), name: 'plan1.pdf' },
        { buffer: Buffer.from('Corrupt'), name: 'corrupt.pdf' },
        { buffer: Buffer.from('Valid PDF'), name: 'plan2.pdf' }
      ]

      const results = await service.batchParseFiles(files, 'project-123')

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  describe('Performance', () => {
    test('should complete parsing within 30 seconds for typical file', async () => {
      const mockFile = Buffer.from('Mock PDF')
      const startTime = Date.now()

      await service.parseFile(mockFile, 'test.pdf', 'project-123')

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(30000)
    }, 35000)

    test('should cache repeated file parses', async () => {
      const mockFile = Buffer.from('Mock PDF')

      const firstParse = await service.parseFile(mockFile, 'test.pdf', 'project-123')
      const secondParse = await service.parseFile(mockFile, 'test.pdf', 'project-123')

      expect(firstParse.fileId).toBe(secondParse.fileId)
      expect(secondParse.cached).toBe(true)
    })
  })
})
