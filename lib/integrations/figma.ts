/**
 * Figma Integration Service
 *
 * Enables import of designs from Figma into Abode AI for 3D conversion
 */

export interface FigmaConfig {
  accessToken: string
  teamId?: string
}

export interface FigmaFile {
  key: string
  name: string
  thumbnail_url?: string
  last_modified: string
}

export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  fills?: any[]
  strokes?: any[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export class FigmaIntegration {
  private config: FigmaConfig

  constructor(config: FigmaConfig) {
    this.config = config
  }

  /**
   * Get user's Figma files
   */
  async getFiles(projectId?: string): Promise<FigmaFile[]> {
    const endpoint = projectId
      ? `https://api.figma.com/v1/projects/${projectId}/files`
      : 'https://api.figma.com/v1/me/files'

    const response = await fetch(endpoint, {
      headers: {
        'X-Figma-Token': this.config.accessToken
      }
    })

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.files || []
  }

  /**
   * Get file content
   */
  async getFile(fileKey: string): Promise<any> {
    const response = await fetch(
      `https://api.figma.com/v1/files/${fileKey}`,
      {
        headers: {
          'X-Figma-Token': this.config.accessToken
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Export nodes as images
   */
  async exportImages(
    fileKey: string,
    nodeIds: string[],
    format: 'png' | 'jpg' | 'svg' = 'png',
    scale: number = 2
  ): Promise<Record<string, string>> {
    const ids = nodeIds.join(',')
    const response = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`,
      {
        headers: {
          'X-Figma-Token': this.config.accessToken
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.images || {}
  }

  /**
   * Import Figma frame as floor plan
   */
  async importFloorPlan(fileKey: string, nodeId: string): Promise<{
    imageUrl: string
    dimensions: { width: number; height: number }
    metadata: any
  }> {
    console.log(`📐 Importing floor plan from Figma: ${fileKey}/${nodeId}`)

    const file = await this.getFile(fileKey)
    const node = this.findNode(file.document, nodeId)

    if (!node) {
      throw new Error('Node not found')
    }

    const images = await this.exportImages(fileKey, [nodeId], 'png', 2)
    const imageUrl = images[nodeId]

    return {
      imageUrl,
      dimensions: {
        width: node.absoluteBoundingBox?.width || 0,
        height: node.absoluteBoundingBox?.height || 0
      },
      metadata: {
        name: node.name,
        type: node.type,
        fileKey,
        nodeId
      }
    }
  }

  /**
   * Find node by ID in document tree
   */
  private findNode(node: FigmaNode, targetId: string): FigmaNode | null {
    if (node.id === targetId) {
      return node
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(child, targetId)
        if (found) return found
      }
    }

    return null
  }

  /**
   * Extract color palette from design
   */
  async extractColors(fileKey: string): Promise<string[]> {
    const file = await this.getFile(fileKey)
    const colors = new Set<string>()

    const extractFromNode = (node: FigmaNode) => {
      if (node.fills) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b } = fill.color
            const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`
            colors.add(hex)
          }
        })
      }

      if (node.children) {
        node.children.forEach(extractFromNode)
      }
    }

    extractFromNode(file.document)

    return Array.from(colors)
  }
}

export const figma = new FigmaIntegration({
  accessToken: process.env.NEXT_PUBLIC_FIGMA_TOKEN || ''
})
