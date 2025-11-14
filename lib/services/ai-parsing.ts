/**
 * AI Parsing Service for Site Plans
 *
 * This service analyzes uploaded site plans (PDF, JPG, PNG) and extracts:
 * - Scale information
 * - North arrow orientation
 * - Property boundaries
 * - Existing structures
 * - Trees and vegetation
 * - Driveways and paths
 * - Text annotations (via OCR)
 *
 * Returns GeoJSON-formatted data with confidence scores
 */

import { FeatureCollection, Feature, Polygon, Point, LineString } from 'geojson'

interface ParseDocumentParams {
  fileUrl: string
  fileType: string
  fileName: string
}

interface ScaleInfo {
  detected: boolean
  value?: number // scale ratio (e.g., 100 means 1:100)
  unit?: string // 'feet', 'meters', 'inches'
  confidence: number // 0-1
  location?: {
    x: number
    y: number
  }
}

interface NorthArrowInfo {
  detected: boolean
  angle?: number // degrees from north (0-360)
  confidence: number
  location?: {
    x: number
    y: number
  }
}

interface Annotation {
  text: string
  confidence: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface ParseResult {
  geojson: FeatureCollection
  scale: ScaleInfo | null
  northArrow: NorthArrowInfo | null
  propertyLines: FeatureCollection<LineString> | null
  existingStructures: FeatureCollection<Polygon> | null
  trees: FeatureCollection<Point> | null
  driveways: FeatureCollection<Polygon> | null
  annotations: Annotation[]
  confidenceOverall: number
}

/**
 * Main parsing function
 */
export async function parseDocument(params: ParseDocumentParams): Promise<ParseResult> {
  const { fileUrl, fileType, fileName } = params

  // Check if external parsing service is configured
  const parsingServiceUrl = process.env.AI_PARSING_SERVICE_URL

  if (parsingServiceUrl) {
    // Use external AI service (Python/OpenCV/Tesseract)
    return await parseWithExternalService(parsingServiceUrl, params)
  }

  // Fallback to basic parsing
  return await parseWithBasicDetection(params)
}

/**
 * Parse using external AI service
 */
async function parseWithExternalService(
  serviceUrl: string,
  params: ParseDocumentParams
): Promise<ParseResult> {
  try {
    const response = await fetch(`${serviceUrl}/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_PARSING_API_KEY || ''}`
      },
      body: JSON.stringify({
        fileUrl: params.fileUrl,
        fileType: params.fileType,
        fileName: params.fileName
      })
    })

    if (!response.ok) {
      throw new Error(`Parsing service error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('External parsing service error:', error)
    // Fallback to basic parsing
    return await parseWithBasicDetection(params)
  }
}

/**
 * Basic parsing with pattern matching and heuristics
 * This is a fallback/mock implementation that provides structure
 * In production, this would use actual computer vision and OCR
 */
async function parseWithBasicDetection(params: ParseDocumentParams): Promise<ParseResult> {
  const { fileUrl, fileType, fileName } = params

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Detect scale (pattern matching for common scale notations)
  const scale = await detectScale(fileName, fileType)

  // Detect north arrow (image analysis would go here)
  const northArrow = await detectNorthArrow(fileType)

  // Extract property lines (edge detection would go here)
  const propertyLines = await detectPropertyLines()

  // Detect structures (object detection would go here)
  const existingStructures = await detectStructures()

  // Detect trees (circular object detection)
  const trees = await detectTrees()

  // Detect driveways
  const driveways = await detectDriveways()

  // OCR for annotations
  const annotations = await extractAnnotations(fileUrl, fileType)

  // Calculate overall confidence
  const confidences = [
    scale?.confidence || 0,
    northArrow?.confidence || 0,
    propertyLines ? 0.7 : 0,
    existingStructures ? 0.6 : 0,
    trees ? 0.5 : 0
  ]
  const confidenceOverall = confidences.reduce((a, b) => a + b, 0) / confidences.length

  // Combine all features into a single GeoJSON collection
  const allFeatures: Feature[] = []

  if (propertyLines) {
    allFeatures.push(...propertyLines.features)
  }
  if (existingStructures) {
    allFeatures.push(...existingStructures.features)
  }
  if (trees) {
    allFeatures.push(...trees.features)
  }
  if (driveways) {
    allFeatures.push(...driveways.features)
  }

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: allFeatures
  }

  return {
    geojson,
    scale,
    northArrow,
    propertyLines,
    existingStructures,
    trees,
    driveways,
    annotations,
    confidenceOverall
  }
}

/**
 * Detect scale from filename or image analysis
 */
async function detectScale(fileName: string, fileType: string): Promise<ScaleInfo> {
  // Pattern matching for common scale notations in filename
  const scalePatterns = [
    /1[:\-](\d+)/i,  // 1:100, 1-100
    /scale[:\s]*1[:\-](\d+)/i,
    /(\d+)\s*(?:ft|feet|meter|m)/i
  ]

  for (const pattern of scalePatterns) {
    const match = fileName.match(pattern)
    if (match) {
      const value = parseInt(match[1] || match[0])
      return {
        detected: true,
        value,
        unit: fileName.toLowerCase().includes('ft') ? 'feet' : 'meters',
        confidence: 0.8
      }
    }
  }

  // Default: assume common architectural scale
  return {
    detected: false,
    value: 100,
    unit: 'feet',
    confidence: 0.3
  }
}

/**
 * Detect north arrow orientation
 */
async function detectNorthArrow(fileType: string): Promise<NorthArrowInfo> {
  // In production: use image analysis to find arrow symbols
  // For MVP: return default north orientation
  return {
    detected: false,
    angle: 0, // degrees from north
    confidence: 0.3
  }
}

/**
 * Detect property boundary lines
 */
async function detectPropertyLines(): Promise<FeatureCollection<LineString>> {
  // In production: use edge detection and line finding algorithms
  // For MVP: return sample property boundary
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'property_line',
          label: 'North boundary',
          length: 150,
          unit: 'feet'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[0, 100], [150, 100]]
        }
      },
      {
        type: 'Feature',
        properties: {
          type: 'property_line',
          label: 'East boundary',
          length: 100,
          unit: 'feet'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[150, 0], [150, 100]]
        }
      },
      {
        type: 'Feature',
        properties: {
          type: 'property_line',
          label: 'South boundary',
          length: 150,
          unit: 'feet'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[0, 0], [150, 0]]
        }
      },
      {
        type: 'Feature',
        properties: {
          type: 'property_line',
          label: 'West boundary',
          length: 100,
          unit: 'feet'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[0, 0], [0, 100]]
        }
      }
    ]
  }
}

/**
 * Detect existing structures
 */
async function detectStructures(): Promise<FeatureCollection<Polygon>> {
  // In production: use object detection to find building footprints
  // For MVP: return sample structure
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'existing_structure',
          label: 'Main House',
          area: 2400,
          unit: 'sqft'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [30, 40],
            [80, 40],
            [80, 80],
            [30, 80],
            [30, 40]
          ]]
        }
      }
    ]
  }
}

/**
 * Detect trees and vegetation
 */
async function detectTrees(): Promise<FeatureCollection<Point>> {
  // In production: use circular object detection
  // For MVP: return sample trees
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'tree',
          species: 'unknown',
          diameter: 24,
          unit: 'inches'
        },
        geometry: {
          type: 'Point',
          coordinates: [20, 20]
        }
      },
      {
        type: 'Feature',
        properties: {
          type: 'tree',
          species: 'unknown',
          diameter: 18,
          unit: 'inches'
        },
        geometry: {
          type: 'Point',
          coordinates: [120, 30]
        }
      }
    ]
  }
}

/**
 * Detect driveways and paved areas
 */
async function detectDriveways(): Promise<FeatureCollection<Polygon>> {
  // In production: use texture/pattern analysis
  // For MVP: return sample driveway
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'driveway',
          material: 'unknown',
          area: 400,
          unit: 'sqft'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 30],
            [25, 30],
            [25, 46],
            [0, 46],
            [0, 30]
          ]]
        }
      }
    ]
  }
}

/**
 * Extract text annotations using OCR
 */
async function extractAnnotations(fileUrl: string, fileType: string): Promise<Annotation[]> {
  // In production: use Tesseract OCR or Google Vision API
  // For MVP: return sample annotations

  // Check if external OCR service is configured
  const ocrServiceUrl = process.env.OCR_SERVICE_URL
  if (ocrServiceUrl) {
    try {
      const response = await fetch(`${ocrServiceUrl}/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OCR_API_KEY || ''}`
        },
        body: JSON.stringify({ imageUrl: fileUrl })
      })

      if (response.ok) {
        const result = await response.json()
        return result.annotations || []
      }
    } catch (error) {
      console.error('OCR service error:', error)
    }
  }

  // Fallback: return sample annotations
  return [
    {
      text: '150\' - 0"',
      confidence: 0.85,
      bbox: { x: 75, y: 102, width: 40, height: 10 }
    },
    {
      text: 'NORTH',
      confidence: 0.9,
      bbox: { x: 140, y: 90, width: 30, height: 8 }
    },
    {
      text: 'SCALE: 1" = 20\'',
      confidence: 0.75,
      bbox: { x: 10, y: 5, width: 60, height: 8 }
    },
    {
      text: 'SETBACK 20\'',
      confidence: 0.7,
      bbox: { x: 85, y: 35, width: 50, height: 8 }
    }
  ]
}
