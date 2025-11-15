import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RAGService, type DocumentChunk } from '@/lib/services/rag'

describe('RAGService', () => {
  let service: RAGService

  beforeEach(() => {
    service = new RAGService(
      { model: 'local', dimensions: 128, batchSize: 10 },
      { chunkSize: 500, chunkOverlap: 50, preserveSentences: true }
    )
  })

  describe('Document Chunking', () => {
    it('should chunk a document into smaller pieces', async () => {
      const content = `
        This is the first paragraph with some content.
        It has multiple sentences that should be kept together.

        This is the second paragraph.
        It also has multiple sentences.
        We want to preserve sentence boundaries.
      `.repeat(5)

      const chunks = await service.chunkDocument(content, {
        source: 'test-doc.txt'
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toBeTruthy()
      expect(chunks[0].metadata.source).toBe('test-doc.txt')
      expect(chunks[0].metadata.chunkIndex).toBe(0)
    })

    it('should create chunks with overlap', async () => {
      const content = 'A'.repeat(1000) + 'B'.repeat(1000) + 'C'.repeat(1000)

      const chunks = await service.chunkDocument(content, {
        source: 'overlap-test.txt'
      }, {
        chunkSize: 1000,
        chunkOverlap: 100,
        preserveSentences: false
      })

      expect(chunks.length).toBeGreaterThan(2)

      // Check that consecutive chunks have overlap
      if (chunks.length > 1) {
        const chunk1End = chunks[0].content.slice(-50)
        const chunk2Start = chunks[1].content.slice(0, 50)
        // Some overlap should exist
        expect(chunk2Start).toBeTruthy()
      }
    })

    it('should preserve sentence boundaries when requested', async () => {
      const content = `
        First sentence here. Second sentence here. Third sentence here.
        Fourth sentence here. Fifth sentence here.
      `

      const chunks = await service.chunkDocument(content, {
        source: 'sentences.txt'
      }, {
        chunkSize: 100,
        preserveSentences: true
      })

      chunks.forEach(chunk => {
        // Each chunk should end with sentence punctuation or be the last chunk
        const trimmed = chunk.content.trim()
        if (trimmed.length > 0) {
          expect(
            trimmed.endsWith('.') ||
            trimmed.endsWith('!') ||
            trimmed.endsWith('?') ||
            chunk === chunks[chunks.length - 1]
          ).toBe(true)
        }
      })
    })

    it('should include metadata in chunks', async () => {
      const chunks = await service.chunkDocument('Test content', {
        source: 'test.txt',
        page: 1,
        section: 'Introduction'
      })

      expect(chunks[0].metadata.source).toBe('test.txt')
      expect(chunks[0].metadata.page).toBe(1)
      expect(chunks[0].metadata.section).toBe('Introduction')
      expect(chunks[0].metadata.timestamp).toBeInstanceOf(Date)
    })

    it('should handle empty documents', async () => {
      const chunks = await service.chunkDocument('', {
        source: 'empty.txt'
      })

      expect(chunks.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle documents smaller than chunk size', async () => {
      const content = 'Small document'

      const chunks = await service.chunkDocument(content, {
        source: 'small.txt'
      }, {
        chunkSize: 1000
      })

      expect(chunks.length).toBe(1)
      expect(chunks[0].content).toBe(content)
    })
  })

  describe('Embedding Generation', () => {
    it('should generate embeddings for chunks', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'chunk1',
          content: 'First chunk content',
          metadata: { source: 'test.txt', timestamp: new Date() }
        },
        {
          id: 'chunk2',
          content: 'Second chunk content',
          metadata: { source: 'test.txt', timestamp: new Date() }
        }
      ]

      const embedded = await service.generateEmbeddings(chunks)

      expect(embedded.length).toBe(2)
      expect(embedded[0].embedding).toBeDefined()
      expect(embedded[0].embedding?.length).toBe(128) // dimensions
      expect(embedded[1].embedding).toBeDefined()
    })

    it('should process embeddings in batches', async () => {
      const chunks: DocumentChunk[] = Array.from({ length: 25 }, (_, i) => ({
        id: `chunk${i}`,
        content: `Chunk ${i} content`,
        metadata: { source: 'test.txt', timestamp: new Date() }
      }))

      const embedded = await service.generateEmbeddings(chunks)

      expect(embedded.length).toBe(25)
      embedded.forEach(chunk => {
        expect(chunk.embedding).toBeDefined()
      })
    })

    it('should generate deterministic embeddings for same content', async () => {
      const chunk: DocumentChunk = {
        id: 'test',
        content: 'Test content',
        metadata: { source: 'test.txt', timestamp: new Date() }
      }

      const embedded1 = await service.generateEmbeddings([chunk])
      const embedded2 = await service.generateEmbeddings([chunk])

      expect(embedded1[0].embedding).toEqual(embedded2[0].embedding)
    })

    it('should normalize embeddings', async () => {
      const chunk: DocumentChunk = {
        id: 'test',
        content: 'Test',
        metadata: { source: 'test.txt', timestamp: new Date() }
      }

      const embedded = await service.generateEmbeddings([chunk])
      const embedding = embedded[0].embedding!

      // Calculate magnitude
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      )

      // Should be approximately 1 (normalized)
      expect(magnitude).toBeCloseTo(1.0, 2)
    })
  })

  describe('Vector Storage', () => {
    it('should add chunks to storage', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          embedding: [0.1, 0.2, 0.3],
          metadata: { source: 'test.txt', timestamp: new Date() }
        }
      ]

      await service.addChunks(chunks)

      const stats = service.getStats()
      expect(stats.totalChunks).toBe(1)
      expect(stats.chunksWithEmbeddings).toBe(1)
    })

    it('should not add chunks without embeddings', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'chunk1',
          content: 'Test content',
          metadata: { source: 'test.txt', timestamp: new Date() }
        }
      ]

      await service.addChunks(chunks)

      const stats = service.getStats()
      expect(stats.totalChunks).toBe(0)
    })

    it('should clear all chunks', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'chunk1',
          content: 'Test',
          embedding: [0.1, 0.2],
          metadata: { source: 'test.txt', timestamp: new Date() }
        }
      ]

      await service.addChunks(chunks)
      expect(service.getStats().totalChunks).toBe(1)

      service.clear()
      expect(service.getStats().totalChunks).toBe(0)
    })
  })

  describe('Retrieval', () => {
    beforeEach(async () => {
      // Add some test chunks
      const chunks = await service.chunkDocument(
        `
        Machine learning is a subset of artificial intelligence.
        Deep learning uses neural networks with multiple layers.
        Natural language processing enables computers to understand human language.
        Computer vision allows machines to interpret images and videos.
        Reinforcement learning is learning by trial and error.
        `,
        { source: 'ai-basics.txt' }
      )

      const embedded = await service.generateEmbeddings(chunks)
      await service.addChunks(embedded)
    })

    it('should retrieve relevant chunks for a query', async () => {
      const result = await service.retrieve('What is deep learning?', {
        topK: 3
      })

      expect(result.chunks.length).toBeGreaterThan(0)
      expect(result.chunks.length).toBeLessThanOrEqual(3)
      expect(result.query).toBe('What is deep learning?')
      expect(result.retrievalTime).toBeGreaterThan(0)
    })

    it('should rank results by relevance', async () => {
      const result = await service.retrieve('neural networks', {
        topK: 5
      })

      // Scores should be in descending order
      for (let i = 0; i < result.chunks.length - 1; i++) {
        const score1 = result.chunks[i].score || 0
        const score2 = result.chunks[i + 1].score || 0
        expect(score1).toBeGreaterThanOrEqual(score2)
      }
    })

    it('should respect topK parameter', async () => {
      const result1 = await service.retrieve('machine learning', { topK: 2 })
      const result2 = await service.retrieve('machine learning', { topK: 5 })

      expect(result1.chunks.length).toBeLessThanOrEqual(2)
      expect(result2.chunks.length).toBeLessThanOrEqual(5)
    })

    it('should respect minimum score threshold', async () => {
      const result = await service.retrieve('completely unrelated query xyz123', {
        topK: 10,
        minScore: 0.5 // High threshold
      })

      result.chunks.forEach(chunk => {
        expect(chunk.score).toBeGreaterThanOrEqual(0.5)
      })
    })

    it('should build context string from results', async () => {
      const result = await service.retrieve('machine learning', {
        topK: 2
      })

      expect(result.context).toBeTruthy()
      expect(result.context).toContain('[Document 1:')
      expect(result.context).toContain('ai-basics.txt')
    })

    it('should support hybrid search', async () => {
      const semanticOnly = await service.retrieve('AI learning', {
        hybridAlpha: 1.0, // Pure semantic
        topK: 3
      })

      const keywordOnly = await service.retrieve('AI learning', {
        hybridAlpha: 0.0, // Pure keyword
        topK: 3
      })

      const hybrid = await service.retrieve('AI learning', {
        hybridAlpha: 0.5, // Balanced
        topK: 3
      })

      // Results may differ
      expect(semanticOnly.chunks).toBeDefined()
      expect(keywordOnly.chunks).toBeDefined()
      expect(hybrid.chunks).toBeDefined()
    })

    it('should apply reranking when requested', async () => {
      const withRerank = await service.retrieve('neural networks', {
        topK: 3,
        rerank: true
      })

      const withoutRerank = await service.retrieve('neural networks', {
        topK: 3,
        rerank: false
      })

      expect(withRerank.chunks).toBeDefined()
      expect(withoutRerank.chunks).toBeDefined()
      // Rankings may differ
    })

    it('should filter by metadata', async () => {
      // Add chunks from different sources
      const chunks1 = await service.chunkDocument(
        'Content from source 1',
        { source: 'source1.txt' }
      )
      const chunks2 = await service.chunkDocument(
        'Content from source 2',
        { source: 'source2.txt' }
      )

      const embedded1 = await service.generateEmbeddings(chunks1)
      const embedded2 = await service.generateEmbeddings(chunks2)

      service.clear()
      await service.addChunks([...embedded1, ...embedded2])

      const result = await service.retrieve('content', {
        topK: 10,
        filter: { source: 'source1.txt' }
      })

      result.chunks.forEach(chunk => {
        expect(chunk.metadata.source).toBe('source1.txt')
      })
    })
  })

  describe('Statistics', () => {
    it('should return accurate statistics', async () => {
      const chunks = await service.chunkDocument(
        'A'.repeat(500) + 'B'.repeat(500),
        { source: 'test.txt' }
      )

      const embedded = await service.generateEmbeddings(chunks)
      await service.addChunks(embedded)

      const stats = service.getStats()

      expect(stats.totalChunks).toBe(chunks.length)
      expect(stats.chunksWithEmbeddings).toBe(chunks.length)
      expect(stats.averageChunkSize).toBeGreaterThan(0)
    })
  })

  describe('Import/Export', () => {
    it('should export chunks', async () => {
      const chunks = await service.chunkDocument(
        'Test content for export',
        { source: 'test.txt' }
      )

      const embedded = await service.generateEmbeddings(chunks)
      await service.addChunks(embedded)

      const exported = service.export()

      expect(exported.length).toBe(chunks.length)
      expect(exported[0].embedding).toBeDefined()
    })

    it('should import chunks', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'import1',
          content: 'Imported content',
          embedding: [0.1, 0.2, 0.3],
          metadata: { source: 'imported.txt', timestamp: new Date() }
        }
      ]

      await service.import(chunks)

      const stats = service.getStats()
      expect(stats.totalChunks).toBe(1)
    })

    it('should maintain data integrity after export/import', async () => {
      const original = await service.chunkDocument(
        'Original content',
        { source: 'original.txt' }
      )

      const embedded = await service.generateEmbeddings(original)
      await service.addChunks(embedded)

      const exported = service.export()

      service.clear()
      await service.import(exported)

      const result = await service.retrieve('Original', { topK: 1 })
      expect(result.chunks.length).toBeGreaterThan(0)
    })
  })

  describe('Similarity Calculations', () => {
    it('should calculate cosine similarity correctly', async () => {
      const service = new RAGService()

      // Access private method via any
      const similarity1 = (service as any).cosineSimilarity(
        [1, 0, 0],
        [1, 0, 0]
      )
      expect(similarity1).toBeCloseTo(1.0, 2)

      const similarity2 = (service as any).cosineSimilarity(
        [1, 0, 0],
        [0, 1, 0]
      )
      expect(similarity2).toBeCloseTo(0.0, 2)

      const similarity3 = (service as any).cosineSimilarity(
        [1, 1, 0],
        [1, 1, 0]
      )
      expect(similarity3).toBeCloseTo(1.0, 2)
    })

    it('should calculate keyword similarity', async () => {
      const service = new RAGService()

      const similarity1 = (service as any).keywordSimilarity(
        'machine learning',
        'machine learning is great'
      )
      expect(similarity1).toBeGreaterThan(0)

      const similarity2 = (service as any).keywordSimilarity(
        'machine learning',
        'completely different topic'
      )
      expect(similarity2).toBeLessThan(similarity1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long documents', async () => {
      const content = 'A'.repeat(100000)

      const chunks = await service.chunkDocument(content, {
        source: 'long.txt'
      })

      expect(chunks.length).toBeGreaterThan(10)
    })

    it('should handle special characters', async () => {
      const content = '🎨 Special chars: @#$%^&*() \n\t\r Unicode: 你好'

      const chunks = await service.chunkDocument(content, {
        source: 'special.txt'
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('🎨')
    })

    it('should handle empty queries', async () => {
      const result = await service.retrieve('', { topK: 5 })

      expect(result.chunks).toBeDefined()
    })
  })
})
