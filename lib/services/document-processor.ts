/**
 * Document Processor Service
 *
 * Handles document parsing, text extraction, and preparation for RAG.
 * Supports multiple document formats: PDF, DOCX, TXT, MD, HTML, etc.
 */

import { type DocumentChunk } from './rag'

export interface ProcessedDocument {
  id: string
  title: string
  content: string
  metadata: {
    source: string
    format: string
    size: number
    pages?: number
    author?: string
    createdAt?: Date
    modifiedAt?: Date
    [key: string]: any
  }
}

export interface ProcessingOptions {
  extractMetadata?: boolean
  cleanText?: boolean
  preserveFormatting?: boolean
  maxSize?: number // Max file size in bytes
}

export class DocumentProcessor {
  private supportedFormats = [
    'txt', 'md', 'html', 'json',
    'pdf', 'docx', 'doc',
    'csv', 'xml'
  ]

  /**
   * Check if format is supported
   */
  isSupported(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase())
  }

  /**
   * Process a document file
   */
  async processFile(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    const format = this.getFileExtension(file.name)

    if (!this.isSupported(format)) {
      throw new Error(`Unsupported format: ${format}`)
    }

    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File too large: ${file.size} bytes (max: ${options.maxSize})`)
    }

    console.log(`📄 Processing ${file.name} (${format})...`)

    const content = await this.extractContent(file, format, options)
    const metadata = options.extractMetadata
      ? await this.extractMetadata(file, format)
      : this.getBasicMetadata(file, format)

    return {
      id: this.generateDocId(file.name),
      title: file.name,
      content,
      metadata
    }
  }

  /**
   * Process text content directly
   */
  async processText(
    text: string,
    source: string = 'text',
    metadata: Record<string, any> = {}
  ): Promise<ProcessedDocument> {
    return {
      id: this.generateDocId(source),
      title: source,
      content: text,
      metadata: {
        source,
        format: 'txt',
        size: text.length,
        ...metadata
      }
    }
  }

  /**
   * Process URL content
   */
  async processUrl(
    url: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    console.log(`🌐 Fetching content from ${url}...`)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    let content = ''
    let format = 'html'

    if (contentType.includes('text/plain')) {
      content = await response.text()
      format = 'txt'
    } else if (contentType.includes('application/json')) {
      const json = await response.json()
      content = JSON.stringify(json, null, 2)
      format = 'json'
    } else {
      // Assume HTML
      content = await response.text()
      if (options.cleanText) {
        content = this.stripHTML(content)
      }
    }

    return {
      id: this.generateDocId(url),
      title: this.getTitleFromUrl(url),
      content,
      metadata: {
        source: url,
        format,
        size: content.length,
        fetchedAt: new Date()
      }
    }
  }

  /**
   * Extract content from file based on format
   */
  private async extractContent(
    file: File,
    format: string,
    options: ProcessingOptions
  ): Promise<string> {
    switch (format.toLowerCase()) {
      case 'txt':
      case 'md':
        return this.extractTextContent(file)

      case 'html':
        return this.extractHTMLContent(file, options)

      case 'json':
        return this.extractJSONContent(file)

      case 'pdf':
        return this.extractPDFContent(file)

      case 'docx':
      case 'doc':
        return this.extractDocxContent(file)

      case 'csv':
        return this.extractCSVContent(file)

      case 'xml':
        return this.extractXMLContent(file)

      default:
        return this.extractTextContent(file)
    }
  }

  /**
   * Extract plain text content
   */
  private async extractTextContent(file: File): Promise<string> {
    return file.text()
  }

  /**
   * Extract HTML content
   */
  private async extractHTMLContent(
    file: File,
    options: ProcessingOptions
  ): Promise<string> {
    const html = await file.text()
    return options.cleanText ? this.stripHTML(html) : html
  }

  /**
   * Strip HTML tags
   */
  private stripHTML(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = this.decodeHTMLEntities(text)

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()

    return text
  }

  /**
   * Decode HTML entities
   */
  private decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'"
    }

    return text.replace(/&[a-z]+;|&#\d+;/gi, match => entities[match] || match)
  }

  /**
   * Extract JSON content
   */
  private async extractJSONContent(file: File): Promise<string> {
    const text = await file.text()
    const json = JSON.parse(text)
    return JSON.stringify(json, null, 2)
  }

  /**
   * Extract PDF content (placeholder)
   */
  private async extractPDFContent(file: File): Promise<string> {
    // In production, use pdf.js or similar library
    console.warn('PDF extraction requires pdf.js library')
    return `[PDF content from ${file.name}]\n\nPDF parsing not yet implemented. Please install pdf.js library.`
  }

  /**
   * Extract DOCX content (placeholder)
   */
  private async extractDocxContent(file: File): Promise<string> {
    // In production, use mammoth.js or similar library
    console.warn('DOCX extraction requires mammoth.js library')
    return `[DOCX content from ${file.name}]\n\nDOCX parsing not yet implemented. Please install mammoth.js library.`
  }

  /**
   * Extract CSV content
   */
  private async extractCSVContent(file: File): Promise<string> {
    const text = await file.text()
    // Convert CSV to readable text format
    const lines = text.split('\n').filter(line => line.trim())
    return lines.join('\n')
  }

  /**
   * Extract XML content
   */
  private async extractXMLContent(file: File): Promise<string> {
    const xml = await file.text()
    // Basic XML to text conversion
    return this.stripHTML(xml) // Similar to HTML stripping
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(
    file: File,
    format: string
  ): Promise<ProcessedDocument['metadata']> {
    const basic = this.getBasicMetadata(file, format)

    // Add format-specific metadata
    if (format === 'pdf') {
      // In production, extract PDF metadata
      return basic
    } else if (format === 'docx') {
      // In production, extract DOCX metadata
      return basic
    }

    return basic
  }

  /**
   * Get basic file metadata
   */
  private getBasicMetadata(
    file: File,
    format: string
  ): ProcessedDocument['metadata'] {
    return {
      source: file.name,
      format,
      size: file.size,
      modifiedAt: new Date(file.lastModified)
    }
  }

  /**
   * Generate document ID
   */
  private generateDocId(name: string): string {
    const timestamp = Date.now()
    const hash = this.simpleHash(name + timestamp)
    return `doc_${hash}_${timestamp}`
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }

  /**
   * Get title from URL
   */
  private getTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      const parts = path.split('/').filter(p => p)
      return parts[parts.length - 1] || urlObj.hostname
    } catch {
      return url
    }
  }

  /**
   * Clean text content
   */
  cleanText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ')

    // Remove special characters (optional)
    // cleaned = cleaned.replace(/[^\w\s.,!?-]/g, '')

    // Trim
    cleaned = cleaned.trim()

    return cleaned
  }

  /**
   * Split document into sections
   */
  splitSections(
    content: string,
    sectionDelimiter: RegExp = /^#+\s+/gm
  ): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = []
    const lines = content.split('\n')
    let currentSection = { title: 'Introduction', content: '' }

    for (const line of lines) {
      if (sectionDelimiter.test(line)) {
        if (currentSection.content.trim()) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line.replace(sectionDelimiter, '').trim(),
          content: ''
        }
      } else {
        currentSection.content += line + '\n'
      }
    }

    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return [...this.supportedFormats]
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor()
