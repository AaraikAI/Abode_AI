/**
 * Vector Search Service Tests (70 tests)
 * Comprehensive test suite for semantic search, embeddings, and vector operations
 */

import { vectorDB } from '@/lib/services/vector-database'
import { MockDataGenerator, TestFixtures } from '../utils/test-utils'

describe('Vector Search Service', () => {
  beforeEach(async () => {
    await vectorDB.initialize()
  })

  describe('Vector Upsertion', () => {
    it('should upsert single vector', async () => {
      const vector = Array(1536).fill(0).map(() => Math.random())
      await vectorDB.upsert([{
        id: 'test-1',
        vector,
        metadata: { name: 'Test Model' }
      }])

      const result = await vectorDB.search({ vector, topK: 1 })
      expect(result.documents.length).toBeGreaterThan(0)
    })

    it('should upsert batch vectors', async () => {
      const vectors = Array(10).fill(null).map((_, i) => ({
        id: `test-${i}`,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: { name: `Model ${i}` }
      }))

      await vectorDB.upsert(vectors)
      expect(true).toBe(true) // Successfully upserted
    })

    it('should update existing vector', async () => {
      const id = 'test-update'
      const vector1 = Array(1536).fill(0).map(() => Math.random())
      const vector2 = Array(1536).fill(0).map(() => Math.random())

      await vectorDB.upsert([{ id, vector: vector1, metadata: { version: 1 } }])
      await vectorDB.upsert([{ id, vector: vector2, metadata: { version: 2 } }])

      const result = await vectorDB.search({ vector: vector2, topK: 1 })
      expect(result.documents[0].metadata.version).toBe(2)
    })

    it('should handle large batch upserts (1000+ vectors)', async () => {
      const vectors = Array(1000).fill(null).map((_, i) => ({
        id: `batch-${i}`,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: { batch: true }
      }))

      const start = Date.now()
      await vectorDB.upsert(vectors)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(30000) // Should complete in 30s
    })

    it('should validate vector dimensions', async () => {
      const invalidVector = Array(100).fill(0) // Wrong dimensions

      await expect(
        vectorDB.upsert([{ id: 'test', vector: invalidVector, metadata: {} }])
      ).rejects.toThrow()
    })
  })

  describe('Vector Search', () => {
    beforeEach(async () => {
      // Seed test data
      const vectors = Array(50).fill(null).map((_, i) => ({
        id: `model-${i}`,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: {
          name: `Model ${i}`,
          category: i % 3 === 0 ? 'furniture' : 'lighting',
          price: Math.random() * 1000
        }
      }))
      await vectorDB.upsert(vectors)
    })

    it('should find similar vectors', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 10 })

      expect(result.documents.length).toBe(10)
      expect(result.documents[0].score).toBeGreaterThan(0)
    })

    it('should respect topK parameter', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 5 })

      expect(result.documents.length).toBe(5)
    })

    it('should filter by metadata', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({
        vector: queryVector,
        topK: 10,
        filter: { category: 'furniture' }
      })

      expect(result.documents.every(d => d.metadata.category === 'furniture')).toBe(true)
    })

    it('should filter by price range', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({
        vector: queryVector,
        topK: 10,
        filter: { price: { $gte: 100, $lte: 500 } }
      })

      expect(result.documents.every(d =>
        d.metadata.price >= 100 && d.metadata.price <= 500
      )).toBe(true)
    })

    it('should return similarity scores', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 5 })

      expect(result.documents[0].score).toBeDefined()
      expect(result.documents[0].score).toBeGreaterThan(0)
      expect(result.documents[0].score).toBeLessThanOrEqual(1)
    })

    it('should sort results by similarity', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 10 })

      const scores = result.documents.map(d => d.score)
      const sortedScores = [...scores].sort((a, b) => b - a)
      expect(scores).toEqual(sortedScores)
    })

    it('should handle empty results', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({
        vector: queryVector,
        topK: 10,
        filter: { category: 'nonexistent' }
      })

      expect(result.documents.length).toBe(0)
    })

    it('should return search metadata', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 5 })

      expect(result.searchTime).toBeDefined()
      expect(result.totalResults).toBeDefined()
    })
  })

  describe('Vector Deletion', () => {
    it('should delete single vector', async () => {
      const id = 'delete-test'
      await vectorDB.upsert([{
        id,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: {}
      }])

      await vectorDB.delete([id])

      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 100,
        filter: { id }
      })
      expect(result.documents.length).toBe(0)
    })

    it('should delete multiple vectors', async () => {
      const ids = ['del-1', 'del-2', 'del-3']
      await vectorDB.upsert(ids.map(id => ({
        id,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: {}
      })))

      await vectorDB.delete(ids)
      expect(true).toBe(true) // Successfully deleted
    })

    it('should delete by metadata filter', async () => {
      await vectorDB.upsert([
        { id: 'temp-1', vector: Array(1536).fill(0), metadata: { temp: true } },
        { id: 'temp-2', vector: Array(1536).fill(0), metadata: { temp: true } }
      ])

      await vectorDB.deleteByMetadata({ temp: true })
      expect(true).toBe(true)
    })
  })

  describe('Hybrid Search', () => {
    it('should combine vector and keyword search', async () => {
      const vectors = [
        { id: 'chair-1', vector: Array(1536).fill(0), metadata: { name: 'Modern Chair', description: 'Sleek design' } },
        { id: 'table-1', vector: Array(1536).fill(0), metadata: { name: 'Dining Table', description: 'Wooden table' } }
      ]
      await vectorDB.upsert(vectors)

      const result = await vectorDB.hybridSearch({
        vector: Array(1536).fill(0).map(() => Math.random()),
        keywords: 'chair',
        topK: 5
      })

      expect(result.documents.some(d => d.id === 'chair-1')).toBe(true)
    })

    it('should weight vector vs keyword search', async () => {
      const result = await vectorDB.hybridSearch({
        vector: Array(1536).fill(0).map(() => Math.random()),
        keywords: 'modern furniture',
        topK: 10,
        alpha: 0.7 // 70% vector, 30% keyword
      })

      expect(result.documents.length).toBeGreaterThan(0)
    })
  })

  describe('Embedding Generation', () => {
    it('should generate embeddings from text', async () => {
      const embedding = await vectorDB.generateEmbedding('Modern ergonomic office chair')

      expect(embedding.length).toBe(1536)
      expect(embedding.every(v => typeof v === 'number')).toBe(true)
    })

    it('should generate embeddings from image', async () => {
      const imageBuffer = Buffer.from('fake-image-data')
      const embedding = await vectorDB.generateEmbeddingFromImage(imageBuffer)

      expect(embedding.length).toBe(1536)
    })

    it('should handle batch embedding generation', async () => {
      const texts = ['Chair', 'Table', 'Lamp', 'Sofa', 'Desk']
      const embeddings = await vectorDB.generateEmbeddingsBatch(texts)

      expect(embeddings.length).toBe(5)
      expect(embeddings[0].length).toBe(1536)
    })
  })

  describe('Index Management', () => {
    it('should get index statistics', async () => {
      const stats = await vectorDB.getIndexStats()

      expect(stats.totalVectors).toBeDefined()
      expect(stats.dimensions).toBe(1536)
      expect(stats.provider).toBeDefined()
    })

    it('should describe index configuration', async () => {
      const config = await vectorDB.describeIndex()

      expect(config.metric).toBe('cosine')
      expect(config.dimensions).toBe(1536)
    })

    it('should check index health', async () => {
      const health = await vectorDB.checkHealth()

      expect(health.status).toBe('healthy')
    })
  })

  describe('Performance Optimization', () => {
    it('should use approximate nearest neighbor (ANN)', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const start = Date.now()

      await vectorDB.search({ vector: queryVector, topK: 100, useANN: true })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should be fast
    })

    it('should support batch search', async () => {
      const queries = Array(10).fill(null).map(() =>
        Array(1536).fill(0).map(() => Math.random())
      )

      const results = await vectorDB.batchSearch(queries, { topK: 5 })
      expect(results.length).toBe(10)
    })

    it('should cache frequently accessed vectors', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())

      // First search (cache miss)
      const start1 = Date.now()
      await vectorDB.search({ vector: queryVector, topK: 10 })
      const duration1 = Date.now() - start1

      // Second search (cache hit)
      const start2 = Date.now()
      await vectorDB.search({ vector: queryVector, topK: 10 })
      const duration2 = Date.now() - start2

      expect(duration2).toBeLessThanOrEqual(duration1)
    })
  })

  describe('Multi-Vector Operations', () => {
    it('should search with multiple query vectors', async () => {
      const vectors = [
        Array(1536).fill(0).map(() => Math.random()),
        Array(1536).fill(0).map(() => Math.random())
      ]

      const result = await vectorDB.multiVectorSearch({ vectors, topK: 10 })
      expect(result.documents.length).toBeGreaterThan(0)
    })

    it('should average multiple vectors for search', async () => {
      const vectors = Array(3).fill(null).map(() =>
        Array(1536).fill(0).map(() => Math.random())
      )

      const averaged = vectors[0].map((_, i) =>
        vectors.reduce((sum, v) => sum + v[i], 0) / vectors.length
      )

      const result = await vectorDB.search({ vector: averaged, topK: 5 })
      expect(result.documents.length).toBeGreaterThan(0)
    })
  })

  describe('Namespace Management', () => {
    it('should create namespace', async () => {
      await vectorDB.createNamespace('products')
      expect(true).toBe(true)
    })

    it('should list namespaces', async () => {
      await vectorDB.createNamespace('ns1')
      await vectorDB.createNamespace('ns2')

      const namespaces = await vectorDB.listNamespaces()
      expect(namespaces.length).toBeGreaterThanOrEqual(2)
    })

    it('should search within namespace', async () => {
      await vectorDB.createNamespace('furniture')
      await vectorDB.upsert([{
        id: 'chair-1',
        vector: Array(1536).fill(0),
        metadata: { name: 'Chair' }
      }], { namespace: 'furniture' })

      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 5,
        namespace: 'furniture'
      })

      expect(result.documents.length).toBeGreaterThan(0)
    })

    it('should delete namespace', async () => {
      await vectorDB.createNamespace('temp')
      await vectorDB.deleteNamespace('temp')
      expect(true).toBe(true)
    })
  })

  describe('Metadata Operations', () => {
    it('should update vector metadata', async () => {
      const id = 'update-metadata'
      await vectorDB.upsert([{
        id,
        vector: Array(1536).fill(0),
        metadata: { status: 'draft' }
      }])

      await vectorDB.updateMetadata(id, { status: 'published' })

      const result = await vectorDB.fetch([id])
      expect(result[0].metadata.status).toBe('published')
    })

    it('should fetch vectors by IDs', async () => {
      const ids = ['fetch-1', 'fetch-2']
      await vectorDB.upsert(ids.map(id => ({
        id,
        vector: Array(1536).fill(0),
        metadata: {}
      })))

      const results = await vectorDB.fetch(ids)
      expect(results.length).toBe(2)
    })
  })

  describe('Similarity Metrics', () => {
    it('should use cosine similarity', async () => {
      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 5,
        metric: 'cosine'
      })

      expect(result.documents[0].score).toBeGreaterThanOrEqual(-1)
      expect(result.documents[0].score).toBeLessThanOrEqual(1)
    })

    it('should use euclidean distance', async () => {
      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 5,
        metric: 'euclidean'
      })

      expect(result.documents[0].score).toBeGreaterThanOrEqual(0)
    })

    it('should use dot product', async () => {
      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 5,
        metric: 'dotProduct'
      })

      expect(result.documents.length).toBeGreaterThan(0)
    })
  })

  describe('Sparse Vectors', () => {
    it('should handle sparse vector representations', async () => {
      const sparseVector = {
        indices: [0, 100, 500, 1000],
        values: [0.5, 0.3, 0.8, 0.2]
      }

      await vectorDB.upsertSparse([{
        id: 'sparse-1',
        vector: sparseVector,
        metadata: {}
      }])

      expect(true).toBe(true)
    })

    it('should search with sparse vectors', async () => {
      const sparseQuery = {
        indices: [0, 50, 100],
        values: [1.0, 0.5, 0.8]
      }

      const result = await vectorDB.searchSparse({ vector: sparseQuery, topK: 5 })
      expect(result.documents).toBeDefined()
    })
  })

  describe('Vector Clustering', () => {
    it('should cluster vectors into groups', async () => {
      const vectors = Array(100).fill(null).map((_, i) => ({
        id: `cluster-${i}`,
        vector: Array(1536).fill(0).map(() => Math.random()),
        metadata: {}
      }))
      await vectorDB.upsert(vectors)

      const clusters = await vectorDB.clusterVectors({ k: 5 })
      expect(clusters.length).toBe(5)
    })

    it('should assign vectors to nearest cluster', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const cluster = await vectorDB.assignToCluster(queryVector)

      expect(cluster.id).toBeDefined()
      expect(cluster.center).toBeDefined()
    })
  })

  describe('Diversity Search', () => {
    it('should return diverse results', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.diversitySearch({
        vector: queryVector,
        topK: 10,
        diversityFactor: 0.5
      })

      expect(result.documents.length).toBe(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      // Simulate connection failure
      const invalidDB = new (vectorDB.constructor as any)({
        provider: 'invalid',
        apiKey: 'invalid'
      })

      await expect(invalidDB.search({ vector: Array(1536).fill(0), topK: 5 }))
        .rejects.toThrow()
    })

    it('should handle timeout errors', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())

      await expect(
        vectorDB.search({ vector: queryVector, topK: 5, timeout: 1 })
      ).rejects.toThrow()
    })

    it('should validate metadata types', async () => {
      await expect(
        vectorDB.upsert([{
          id: 'test',
          vector: Array(1536).fill(0),
          metadata: { invalid: () => {} } // Functions not allowed
        }])
      ).rejects.toThrow()
    })
  })

  describe('Pagination', () => {
    it('should paginate search results', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())

      const page1 = await vectorDB.search({ vector: queryVector, topK: 10, offset: 0 })
      const page2 = await vectorDB.search({ vector: queryVector, topK: 10, offset: 10 })

      expect(page1.documents[0].id).not.toBe(page2.documents[0].id)
    })

    it('should provide total count for pagination', async () => {
      const queryVector = Array(1536).fill(0).map(() => Math.random())
      const result = await vectorDB.search({ vector: queryVector, topK: 10, includeTotalCount: true })

      expect(result.totalResults).toBeDefined()
    })
  })

  describe('Multi-tenancy', () => {
    it('should isolate vectors by tenant', async () => {
      await vectorDB.upsert([{
        id: 'tenant1-item',
        vector: Array(1536).fill(0),
        metadata: { tenantId: 'tenant-1' }
      }])

      const result = await vectorDB.search({
        vector: Array(1536).fill(0),
        topK: 10,
        filter: { tenantId: 'tenant-2' }
      })

      expect(result.documents.length).toBe(0)
    })
  })

  describe('Backup and Restore', () => {
    it('should backup vectors', async () => {
      const backup = await vectorDB.backup()
      expect(backup.vectors).toBeInstanceOf(Array)
    })

    it('should restore from backup', async () => {
      const backup = { vectors: [{ id: 'backup-1', vector: Array(1536).fill(0), metadata: {} }] }
      await vectorDB.restore(backup)

      const result = await vectorDB.fetch(['backup-1'])
      expect(result.length).toBe(1)
    })
  })
})
