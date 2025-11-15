/**
 * Retrieval-Augmented Generation (RAG) Service
 *
 * Implements document chunking, embedding generation, vector storage,
 * and semantic retrieval for enhanced LLM context.
 *
 * Features:
 * - Document chunking with overlap
 * - Embedding generation via OpenAI/local models
 * - Vector similarity search
 * - Hybrid search (keyword + semantic)
 * - Context management and ranking
 * - Metadata filtering
 */

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    source: string
    page?: number
    section?: string
    timestamp: Date
    [key: string]: any
  }
  embedding?: number[]
  score?: number
}

export interface ChunkingOptions {
  chunkSize: number // Max characters per chunk
  chunkOverlap: number // Overlap between chunks
  separator?: string // Separator for splitting
  preserveSentences?: boolean // Try to keep sentences intact
}

export interface EmbeddingOptions {
  model: string // 'openai' | 'local' | 'custom'
  apiKey?: string
  dimensions?: number
  batchSize?: number
}

export interface RetrievalOptions {
  topK: number // Number of results to return
  minScore?: number // Minimum similarity score
  filter?: Record<string, any> // Metadata filters
  hybridAlpha?: number // Weight for hybrid search (0 = keyword only, 1 = semantic only)
  rerank?: boolean // Apply reranking
}

export interface RAGContext {
  query: string
  chunks: DocumentChunk[]
  totalChunks: number
  retrievalTime: number
  context: string // Combined context for LLM
}

export class RAGService {
  private chunks: Map<string, DocumentChunk> = new Map()
  private embeddingOptions: EmbeddingOptions
  private chunkingOptions: ChunkingOptions

  constructor(
    embeddingOptions: EmbeddingOptions = {
      model: 'openai',
      dimensions: 1536,
      batchSize: 100
    },
    chunkingOptions: ChunkingOptions = {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveSentences: true
    }
  ) {
    this.embeddingOptions = embeddingOptions
    this.chunkingOptions = chunkingOptions
  }

  /**
   * Chunk a document into smaller pieces
   */
  async chunkDocument(
    content: string,
    metadata: Partial<DocumentChunk['metadata']>,
    options?: Partial<ChunkingOptions>
  ): Promise<DocumentChunk[]> {
    const opts = { ...this.chunkingOptions, ...options }
    const chunks: DocumentChunk[] = []

    // Split content into chunks
    const rawChunks = this.splitText(content, opts)

    // Create document chunks with metadata
    for (let i = 0; i < rawChunks.length; i++) {
      const chunk: DocumentChunk = {
        id: `${metadata.source || 'doc'}_chunk_${i}`,
        content: rawChunks[i],
        metadata: {
          source: metadata.source || 'unknown',
          timestamp: new Date(),
          chunkIndex: i,
          totalChunks: rawChunks.length,
          ...metadata
        }
      }

      chunks.push(chunk)
    }

    console.log(`📄 Created ${chunks.length} chunks from document "${metadata.source}"`)
    return chunks
  }

  /**
   * Split text into chunks with overlap
   */
  private splitText(text: string, options: ChunkingOptions): string[] {
    const { chunkSize, chunkOverlap, separator = '\n\n', preserveSentences } = options
    const chunks: string[] = []

    if (preserveSentences) {
      return this.splitBySentences(text, chunkSize, chunkOverlap)
    }

    // Split by separator first
    const sections = text.split(separator).filter(s => s.trim())

    let currentChunk = ''
    let currentSize = 0

    for (const section of sections) {
      const sectionSize = section.length

      if (currentSize + sectionSize > chunkSize && currentChunk) {
        // Save current chunk
        chunks.push(currentChunk.trim())

        // Start new chunk with overlap
        const overlapText = this.getOverlap(currentChunk, chunkOverlap)
        currentChunk = overlapText + section
        currentSize = currentChunk.length
      } else {
        currentChunk += (currentChunk ? separator : '') + section
        currentSize = currentChunk.length
      }
    }

    // Add final chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks.filter(c => c.length > 0)
  }

  /**
   * Split text by sentences while respecting chunk size
   */
  private splitBySentences(text: string, chunkSize: number, overlap: number): string[] {
    // Split into sentences (simple regex)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentSize = 0

    for (const sentence of sentences) {
      const sentenceSize = sentence.length

      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(currentChunk.join(' ').trim())

        // Calculate overlap sentences
        const overlapSentences = this.getOverlapSentences(currentChunk, overlap)
        currentChunk = [...overlapSentences, sentence]
        currentSize = currentChunk.join(' ').length
      } else {
        currentChunk.push(sentence)
        currentSize += sentenceSize
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' ').trim())
    }

    return chunks
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlap(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text
    return text.slice(-overlapSize)
  }

  /**
   * Get overlap sentences
   */
  private getOverlapSentences(sentences: string[], targetSize: number): string[] {
    const overlap: string[] = []
    let size = 0

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i]
      if (size + sentence.length > targetSize) break
      overlap.unshift(sentence)
      size += sentence.length
    }

    return overlap
  }

  /**
   * Generate embeddings for chunks
   */
  async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const { model, batchSize = 100 } = this.embeddingOptions

    console.log(`🔢 Generating embeddings for ${chunks.length} chunks using ${model}...`)

    // Process in batches
    const batches = this.createBatches(chunks, batchSize)
    const embeddedChunks: DocumentChunk[] = []

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`Processing batch ${i + 1}/${batches.length}...`)

      const batchWithEmbeddings = await this.embedBatch(batch)
      embeddedChunks.push(...batchWithEmbeddings)
    }

    console.log(`✅ Generated ${embeddedChunks.length} embeddings`)
    return embeddedChunks
  }

  /**
   * Embed a batch of chunks
   */
  private async embedBatch(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const { model, apiKey } = this.embeddingOptions

    if (model === 'openai') {
      return this.embedWithOpenAI(chunks, apiKey)
    } else if (model === 'local') {
      return this.embedWithLocal(chunks)
    } else {
      // Custom embedding model
      return this.embedWithCustom(chunks)
    }
  }

  /**
   * Generate embeddings using OpenAI
   */
  private async embedWithOpenAI(
    chunks: DocumentChunk[],
    apiKey?: string
  ): Promise<DocumentChunk[]> {
    if (!apiKey) {
      console.warn('OpenAI API key not provided, using mock embeddings')
      return this.embedWithMock(chunks)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: chunks.map(c => c.content)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${data.error?.message || response.statusText}`)
      }

      // Attach embeddings to chunks
      return chunks.map((chunk, i) => ({
        ...chunk,
        embedding: data.data[i].embedding
      }))
    } catch (error) {
      console.error('Failed to generate OpenAI embeddings:', error)
      return this.embedWithMock(chunks)
    }
  }

  /**
   * Generate embeddings using local model (e.g., TensorFlow.js)
   */
  private async embedWithLocal(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    // Placeholder for local embedding model
    // In production, you would use @tensorflow/tfjs or similar
    console.log('Using local embedding model...')
    return this.embedWithMock(chunks)
  }

  /**
   * Generate embeddings using custom model
   */
  private async embedWithCustom(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    // Placeholder for custom embedding endpoint
    console.log('Using custom embedding model...')
    return this.embedWithMock(chunks)
  }

  /**
   * Generate mock embeddings for testing
   */
  private embedWithMock(chunks: DocumentChunk[]): DocumentChunk[] {
    const dimensions = this.embeddingOptions.dimensions || 1536

    return chunks.map(chunk => ({
      ...chunk,
      embedding: this.generateRandomEmbedding(dimensions, chunk.content)
    }))
  }

  /**
   * Generate deterministic random embedding based on content
   */
  private generateRandomEmbedding(dimensions: number, content: string): number[] {
    // Simple hash-based embedding for testing
    const hash = this.simpleHash(content)
    const embedding: number[] = []

    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i
      embedding.push(Math.sin(seed) * Math.cos(seed * 2))
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Add chunks to the vector store
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    // Ensure chunks have embeddings
    const chunksWithEmbeddings = chunks.filter(c => c.embedding)

    if (chunksWithEmbeddings.length === 0) {
      console.warn('No chunks with embeddings to add')
      return
    }

    // Add to storage
    chunksWithEmbeddings.forEach(chunk => {
      this.chunks.set(chunk.id, chunk)
    })

    console.log(`📦 Added ${chunksWithEmbeddings.length} chunks to vector store`)
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(query: string, options?: Partial<RetrievalOptions>): Promise<RAGContext> {
    const startTime = Date.now()

    const opts: RetrievalOptions = {
      topK: 5,
      minScore: 0.0,
      hybridAlpha: 0.7, // Favor semantic search
      rerank: true,
      ...options
    }

    // Generate query embedding
    const queryEmbedding = await this.embedQuery(query)

    // Retrieve chunks
    let results = this.searchChunks(query, queryEmbedding, opts)

    // Apply metadata filters
    if (opts.filter) {
      results = this.applyFilters(results, opts.filter)
    }

    // Rerank if requested
    if (opts.rerank) {
      results = this.rerankResults(query, results)
    }

    // Take top K
    results = results.slice(0, opts.topK)

    const retrievalTime = Date.now() - startTime

    // Build context string
    const context = this.buildContext(results)

    console.log(`🔍 Retrieved ${results.length} chunks in ${retrievalTime}ms`)

    return {
      query,
      chunks: results,
      totalChunks: this.chunks.size,
      retrievalTime,
      context
    }
  }

  /**
   * Generate embedding for query
   */
  private async embedQuery(query: string): Promise<number[]> {
    const queryChunk: DocumentChunk = {
      id: 'query',
      content: query,
      metadata: { source: 'query', timestamp: new Date() }
    }

    const embedded = await this.embedBatch([queryChunk])
    return embedded[0].embedding || []
  }

  /**
   * Search chunks using hybrid search
   */
  private searchChunks(
    query: string,
    queryEmbedding: number[],
    options: RetrievalOptions
  ): DocumentChunk[] {
    const { hybridAlpha = 0.7, minScore = 0.0 } = options

    const results: DocumentChunk[] = []

    for (const chunk of this.chunks.values()) {
      if (!chunk.embedding) continue

      // Semantic similarity (cosine similarity)
      const semanticScore = this.cosineSimilarity(queryEmbedding, chunk.embedding)

      // Keyword similarity (BM25-like)
      const keywordScore = this.keywordSimilarity(query, chunk.content)

      // Hybrid score
      const score = hybridAlpha * semanticScore + (1 - hybridAlpha) * keywordScore

      if (score >= minScore) {
        results.push({
          ...chunk,
          score
        })
      }
    }

    // Sort by score descending
    return results.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let magA = 0
    let magB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
    if (magnitude === 0) return 0

    return dotProduct / magnitude
  }

  /**
   * Calculate keyword similarity (simple TF-IDF-like)
   */
  private keywordSimilarity(query: string, text: string): number {
    const queryTerms = this.tokenize(query.toLowerCase())
    const textTerms = this.tokenize(text.toLowerCase())

    if (queryTerms.length === 0) return 0

    // Count matches
    let matches = 0
    for (const term of queryTerms) {
      if (textTerms.includes(term)) {
        matches++
      }
    }

    return matches / queryTerms.length
  }

  /**
   * Simple tokenizer
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2) // Filter out short words
  }

  /**
   * Apply metadata filters
   */
  private applyFilters(chunks: DocumentChunk[], filters: Record<string, any>): DocumentChunk[] {
    return chunks.filter(chunk => {
      for (const [key, value] of Object.entries(filters)) {
        if (chunk.metadata[key] !== value) {
          return false
        }
      }
      return true
    })
  }

  /**
   * Rerank results using query-context relevance
   */
  private rerankResults(query: string, chunks: DocumentChunk[]): DocumentChunk[] {
    // Simple reranking: boost chunks that contain query terms near the start
    const queryTerms = this.tokenize(query.toLowerCase())

    return chunks.map(chunk => {
      const content = chunk.content.toLowerCase()
      let boost = 1.0

      // Find earliest occurrence of query terms
      let minPosition = content.length
      for (const term of queryTerms) {
        const pos = content.indexOf(term)
        if (pos !== -1 && pos < minPosition) {
          minPosition = pos
        }
      }

      // Boost based on position (earlier = higher boost)
      if (minPosition < content.length) {
        boost = 1.0 + (1.0 - minPosition / content.length) * 0.3
      }

      return {
        ...chunk,
        score: (chunk.score || 0) * boost
      }
    }).sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  /**
   * Build context string from chunks
   */
  private buildContext(chunks: DocumentChunk[]): string {
    return chunks
      .map((chunk, i) => {
        const header = `[Document ${i + 1}: ${chunk.metadata.source}]`
        return `${header}\n${chunk.content}`
      })
      .join('\n\n---\n\n')
  }

  /**
   * Clear all chunks from storage
   */
  clear(): void {
    this.chunks.clear()
    console.log('🗑️ Cleared vector store')
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalChunks: number
    chunksWithEmbeddings: number
    averageChunkSize: number
  } {
    const chunksArray = Array.from(this.chunks.values())
    const withEmbeddings = chunksArray.filter(c => c.embedding).length
    const avgSize = chunksArray.reduce((sum, c) => sum + c.content.length, 0) / chunksArray.length || 0

    return {
      totalChunks: chunksArray.length,
      chunksWithEmbeddings: withEmbeddings,
      averageChunkSize: Math.round(avgSize)
    }
  }

  /**
   * Export chunks (for persistence)
   */
  export(): DocumentChunk[] {
    return Array.from(this.chunks.values())
  }

  /**
   * Import chunks (from persistence)
   */
  async import(chunks: DocumentChunk[]): Promise<void> {
    await this.addChunks(chunks)
  }
}

// Export singleton instance
export const rag = new RAGService()
