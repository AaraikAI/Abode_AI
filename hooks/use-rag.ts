import { useState, useCallback } from 'react'
import { rag, documentProcessor, type RAGContext, type DocumentChunk } from '@/lib/services/rag'
import { type ProcessedDocument } from '@/lib/services/document-processor'

export interface UseRAGOptions {
  topK?: number
  hybridAlpha?: number
  rerank?: boolean
  minScore?: number
}

export function useRAG(options: UseRAGOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [lastResults, setLastResults] = useState<RAGContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Process and add a document to the RAG store
   */
  const addDocument = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    setIsProcessing(true)
    setError(null)

    try {
      onProgress?.(10)

      // Process document
      const doc = await documentProcessor.processFile(file, {
        extractMetadata: true,
        cleanText: true,
        maxSize: 10 * 1024 * 1024 // 10MB
      })

      onProgress?.(30)

      // Chunk document
      const chunks = await rag.chunkDocument(doc.content, doc.metadata)

      onProgress?.(60)

      // Generate embeddings
      const embedded = await rag.generateEmbeddings(chunks)

      onProgress?.(90)

      // Add to store
      await rag.addChunks(embedded)

      onProgress?.(100)

      return doc.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process document'
      setError(message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  /**
   * Add text content directly
   */
  const addText = useCallback(async (
    text: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<string> => {
    setIsProcessing(true)
    setError(null)

    try {
      const doc = await documentProcessor.processText(text, source, metadata)

      const chunks = await rag.chunkDocument(doc.content, doc.metadata)
      const embedded = await rag.generateEmbeddings(chunks)
      await rag.addChunks(embedded)

      return doc.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add text'
      setError(message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  /**
   * Add content from URL
   */
  const addUrl = useCallback(async (url: string): Promise<string> => {
    setIsProcessing(true)
    setError(null)

    try {
      const doc = await documentProcessor.processUrl(url, {
        cleanText: true
      })

      const chunks = await rag.chunkDocument(doc.content, doc.metadata)
      const embedded = await rag.generateEmbeddings(chunks)
      await rag.addChunks(embedded)

      return doc.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch URL'
      setError(message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  /**
   * Search for relevant content
   */
  const search = useCallback(async (
    query: string,
    searchOptions?: Partial<UseRAGOptions>
  ): Promise<RAGContext> => {
    setIsSearching(true)
    setError(null)

    try {
      const opts = { ...options, ...searchOptions }
      const results = await rag.retrieve(query, {
        topK: opts.topK || 5,
        hybridAlpha: opts.hybridAlpha || 0.7,
        rerank: opts.rerank !== false,
        minScore: opts.minScore || 0.0
      })

      setLastResults(results)
      return results
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      throw err
    } finally {
      setIsSearching(false)
    }
  }, [options])

  /**
   * Get RAG statistics
   */
  const getStats = useCallback(() => {
    return rag.getStats()
  }, [])

  /**
   * Clear all documents
   */
  const clear = useCallback(() => {
    rag.clear()
    setLastResults(null)
    setError(null)
  }, [])

  /**
   * Export all chunks
   */
  const exportData = useCallback(() => {
    return rag.export()
  }, [])

  /**
   * Import chunks
   */
  const importData = useCallback(async (chunks: DocumentChunk[]) => {
    setIsProcessing(true)
    setError(null)

    try {
      await rag.import(chunks)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setError(message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    // State
    isProcessing,
    isSearching,
    lastResults,
    error,

    // Actions
    addDocument,
    addText,
    addUrl,
    search,
    getStats,
    clear,
    exportData,
    importData,
  }
}
