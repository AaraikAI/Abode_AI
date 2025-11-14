/**
 * GeoJSON Types and Utilities for Site Planning
 *
 * Extends the standard GeoJSON types with domain-specific properties
 * for architectural site plans and features
 */

import type {
  Feature,
  FeatureCollection,
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  Geometry,
  Position
} from 'geojson'

// ============================================================================
// Domain-Specific Feature Properties
// ============================================================================

export interface PropertyLineProperties {
  type: 'property_line'
  label: string
  length: number
  unit: 'feet' | 'meters' | 'inches'
  bearingAngle?: number // degrees
  setback?: number
  confidence?: number
}

export interface StructureProperties {
  type: 'existing_structure' | 'proposed_structure'
  label: string
  area: number
  unit: 'sqft' | 'sqm'
  height?: number
  floors?: number
  buildingType?: 'residential' | 'commercial' | 'adu' | 'garage' | 'shed' | 'other'
  confidence?: number
}

export interface TreeProperties {
  type: 'tree' | 'shrub' | 'vegetation'
  species?: string
  diameter?: number // trunk diameter
  canopyDiameter?: number
  unit: 'inches' | 'feet' | 'meters'
  protected?: boolean
  toRemove?: boolean
  confidence?: number
}

export interface DrivewayProperties {
  type: 'driveway' | 'path' | 'patio' | 'deck'
  material?: string
  area: number
  unit: 'sqft' | 'sqm'
  confidence?: number
}

export interface UtilityProperties {
  type: 'utility_line' | 'sewer' | 'water' | 'gas' | 'electric' | 'cable'
  label?: string
  depth?: number
  diameter?: number
  material?: string
  confidence?: number
}

export interface SetbackProperties {
  type: 'setback_line'
  side: 'front' | 'rear' | 'left' | 'right'
  distance: number
  unit: 'feet' | 'meters'
  required: boolean
}

export interface AnnotationProperties {
  type: 'annotation'
  text: string
  category?: 'dimension' | 'label' | 'note' | 'warning'
  confidence?: number
}

export interface EasementProperties {
  type: 'easement'
  label: string
  purpose: string
  width?: number
  restrictions?: string[]
}

// ============================================================================
// Typed Features
// ============================================================================

export type PropertyLineFeature = Feature<LineString, PropertyLineProperties>
export type StructureFeature = Feature<Polygon, StructureProperties>
export type TreeFeature = Feature<Point, TreeProperties>
export type DrivewayFeature = Feature<Polygon, DrivewayProperties>
export type UtilityFeature = Feature<LineString, UtilityProperties>
export type SetbackFeature = Feature<LineString, SetbackProperties>
export type AnnotationFeature = Feature<Point, AnnotationProperties>
export type EasementFeature = Feature<Polygon, EasementProperties>

export type SitePlanFeature =
  | PropertyLineFeature
  | StructureFeature
  | TreeFeature
  | DrivewayFeature
  | UtilityFeature
  | SetbackFeature
  | AnnotationFeature
  | EasementFeature

// ============================================================================
// Feature Collections
// ============================================================================

export type SitePlanFeatureCollection = FeatureCollection<Geometry, SitePlanFeature['properties']>

// ============================================================================
// Coordinate Reference System (CRS)
// ============================================================================

export interface CRS {
  type: 'name' | 'link'
  properties: {
    name?: string
    href?: string
    type?: string
  }
}

export interface ProjectCRS extends CRS {
  // Custom CRS for project-specific coordinate system
  // Usually in local feet/meters from a site origin
  origin: Position // [lon, lat] or [x, y]
  unit: 'feet' | 'meters'
  rotation?: number // degrees from north
}

// ============================================================================
// Parsed Site Plan
// ============================================================================

export interface ParsedSitePlan {
  type: 'FeatureCollection'
  features: SitePlanFeature[]
  crs?: ProjectCRS
  bbox?: [number, number, number, number] // [minX, minY, maxX, maxY]
  metadata: {
    projectId: string
    fileId: string
    parsedAt: string
    parsedBy: string
    scale?: {
      detected: boolean
      value?: number
      unit?: string
      confidence: number
    }
    northArrow?: {
      detected: boolean
      angle?: number
      confidence: number
    }
    confidenceOverall: number
  }
}

// ============================================================================
// GeoJSON Utilities
// ============================================================================

export class GeoJSONUtils {
  /**
   * Calculate the area of a polygon in square units
   */
  static calculateArea(polygon: Polygon, unit: 'sqft' | 'sqm' = 'sqft'): number {
    const coords = polygon.coordinates[0]
    let area = 0

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]
      const [x2, y2] = coords[i + 1]
      area += x1 * y2 - x2 * y1
    }

    area = Math.abs(area / 2)

    // Convert to requested unit if needed
    // (assumes coordinates are in feet by default)
    if (unit === 'sqm') {
      area = area * 0.092903 // sqft to sqm
    }

    return Math.round(area * 100) / 100
  }

  /**
   * Calculate the length of a line string
   */
  static calculateLength(lineString: LineString, unit: 'feet' | 'meters' = 'feet'): number {
    const coords = lineString.coordinates
    let length = 0

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]
      const [x2, y2] = coords[i + 1]
      const segment = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      length += segment
    }

    // Convert to requested unit if needed
    if (unit === 'meters') {
      length = length * 0.3048 // feet to meters
    }

    return Math.round(length * 100) / 100
  }

  /**
   * Calculate the centroid of a polygon
   */
  static calculateCentroid(polygon: Polygon): Position {
    const coords = polygon.coordinates[0]
    let x = 0
    let y = 0

    for (const [cx, cy] of coords) {
      x += cx
      y += cy
    }

    return [x / coords.length, y / coords.length]
  }

  /**
   * Calculate bounding box for a feature collection
   */
  static calculateBBox(featureCollection: FeatureCollection): [number, number, number, number] {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const feature of featureCollection.features) {
      const coords = this.extractCoordinates(feature.geometry)

      for (const [x, y] of coords) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }

    return [minX, minY, maxX, maxY]
  }

  /**
   * Extract all coordinates from a geometry
   */
  private static extractCoordinates(geometry: Geometry): Position[] {
    switch (geometry.type) {
      case 'Point':
        return [geometry.coordinates]
      case 'LineString':
        return geometry.coordinates
      case 'Polygon':
        return geometry.coordinates.flat()
      case 'MultiPoint':
        return geometry.coordinates
      case 'MultiLineString':
        return geometry.coordinates.flat()
      case 'MultiPolygon':
        return geometry.coordinates.flat(2)
      case 'GeometryCollection':
        return geometry.geometries.flatMap(g => this.extractCoordinates(g))
      default:
        return []
    }
  }

  /**
   * Filter features by type
   */
  static filterByType<T extends SitePlanFeature>(
    featureCollection: FeatureCollection,
    type: string
  ): T[] {
    return featureCollection.features.filter(
      f => f.properties?.type === type
    ) as T[]
  }

  /**
   * Create a GeoJSON Point feature
   */
  static createPointFeature(
    coordinates: Position,
    properties: Record<string, any>
  ): Feature<Point> {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates
      },
      properties
    }
  }

  /**
   * Create a GeoJSON LineString feature
   */
  static createLineStringFeature(
    coordinates: Position[],
    properties: Record<string, any>
  ): Feature<LineString> {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties
    }
  }

  /**
   * Create a GeoJSON Polygon feature
   */
  static createPolygonFeature(
    coordinates: Position[][],
    properties: Record<string, any>
  ): Feature<Polygon> {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates
      },
      properties
    }
  }

  /**
   * Convert local coordinates to geographic coordinates
   */
  static localToGeographic(
    localCoords: Position,
    origin: Position,
    rotation: number = 0
  ): Position {
    const [x, y] = localCoords
    const [originLon, originLat] = origin

    // Simple planar approximation (for small areas)
    // In production, use proper coordinate transformation
    const metersPerDegLat = 111320
    const metersPerDegLon = 111320 * Math.cos(originLat * Math.PI / 180)

    const xMeters = x * 0.3048 // feet to meters
    const yMeters = y * 0.3048

    // Apply rotation if needed
    const rad = rotation * Math.PI / 180
    const xRot = xMeters * Math.cos(rad) - yMeters * Math.sin(rad)
    const yRot = xMeters * Math.sin(rad) + yMeters * Math.cos(rad)

    const lon = originLon + (xRot / metersPerDegLon)
    const lat = originLat + (yRot / metersPerDegLat)

    return [lon, lat]
  }

  /**
   * Validate GeoJSON structure
   */
  static validate(geojson: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!geojson) {
      errors.push('GeoJSON is null or undefined')
      return { valid: false, errors }
    }

    if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature') {
      errors.push('Invalid GeoJSON type')
    }

    if (geojson.type === 'FeatureCollection') {
      if (!Array.isArray(geojson.features)) {
        errors.push('Features must be an array')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
