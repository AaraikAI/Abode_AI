import { useState, useCallback, useEffect } from 'react'
import { slm, type InferenceRequest, type InferenceResponse, type SLMConfig } from '@/lib/services/slm'

export function useSLM() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInferring, setIsInferring] = useState(false)
  const [lastResponse, setLastResponse] = useState<InferenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState(slm.getModelInfo())

  useEffect(() => {
    setModelInfo(slm.getModelInfo())
    setIsLoaded(slm.getModelInfo().isLoaded)
  }, [])

  const loadModel = useCallback(async () => {
    setError(null)
    try {
      await slm.loadModel()
      setIsLoaded(true)
      setModelInfo(slm.getModelInfo())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model'
      setError(message)
      throw err
    }
  }, [])

  const infer = useCallback(async (request: InferenceRequest): Promise<InferenceResponse> => {
    setIsInferring(true)
    setError(null)

    try {
      const response = await slm.infer(request)
      setLastResponse(response)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Inference failed'
      setError(message)
      throw err
    } finally {
      setIsInferring(false)
    }
  }, [])

  const inferStream = useCallback(async function* (
    request: InferenceRequest,
    onChunk?: (chunk: string) => void
  ): AsyncGenerator<string, void, unknown> {
    setIsInferring(true)
    setError(null)

    try {
      for await (const chunk of slm.inferStream(request)) {
        onChunk?.(chunk)
        yield chunk
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Streaming failed'
      setError(message)
      throw err
    } finally {
      setIsInferring(false)
    }
  }, [])

  const unload = useCallback(async () => {
    await slm.unload()
    setIsLoaded(false)
    setModelInfo(slm.getModelInfo())
  }, [])

  return {
    isLoaded,
    isInferring,
    lastResponse,
    error,
    modelInfo,
    loadModel,
    infer,
    inferStream,
    unload
  }
}
