import { useState, useCallback, useEffect } from 'react'
import {
  rodinAI,
  type RodinJob,
  type TextTo3DRequest,
  type ImageTo3DRequest,
  type TextureSynthesisRequest,
  type GenerativeEditRequest
} from '@/lib/services/rodin-ai'

export function useRodinAI() {
  const [jobs, setJobs] = useState<RodinJob[]>([])
  const [activeJobs, setActiveJobs] = useState<RodinJob[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load all jobs
    setJobs(rodinAI.getAllJobs())

    // Filter active jobs
    const active = rodinAI.getAllJobs().filter(
      job => job.status === 'queued' || job.status === 'processing'
    )
    setActiveJobs(active)
  }, [])

  const textTo3D = useCallback(async (request: TextTo3DRequest) => {
    setIsLoading(true)
    try {
      const job = await rodinAI.textTo3D(request)
      setJobs(prev => [job, ...prev])
      setActiveJobs(prev => [job, ...prev])
      return job
    } finally {
      setIsLoading(false)
    }
  }, [])

  const imageTo3D = useCallback(async (request: ImageTo3DRequest) => {
    setIsLoading(true)
    try {
      const job = await rodinAI.imageTo3D(request)
      setJobs(prev => [job, ...prev])
      setActiveJobs(prev => [job, ...prev])
      return job
    } finally {
      setIsLoading(false)
    }
  }, [])

  const synthesizeTexture = useCallback(async (request: TextureSynthesisRequest) => {
    setIsLoading(true)
    try {
      const job = await rodinAI.synthesizeTexture(request)
      setJobs(prev => [job, ...prev])
      setActiveJobs(prev => [job, ...prev])
      return job
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generativeEdit = useCallback(async (request: GenerativeEditRequest) => {
    setIsLoading(true)
    try {
      const job = await rodinAI.generativeEdit(request)
      setJobs(prev => [job, ...prev])
      setActiveJobs(prev => [job, ...prev])
      return job
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getJobStatus = useCallback(async (jobId: string) => {
    const job = await rodinAI.getJobStatus(jobId)
    if (job) {
      setJobs(prev => prev.map(j => j.jobId === jobId ? job : j))

      // Update active jobs
      if (job.status === 'completed' || job.status === 'failed') {
        setActiveJobs(prev => prev.filter(j => j.jobId !== jobId))
      }
    }
    return job
  }, [])

  const cancelJob = useCallback(async (jobId: string) => {
    await rodinAI.cancelJob(jobId)
    setActiveJobs(prev => prev.filter(j => j.jobId !== jobId))
    setJobs(prev => prev.map(j =>
      j.jobId === jobId ? { ...j, status: 'failed' as const, error: 'Cancelled' } : j
    ))
  }, [])

  const downloadResult = useCallback(async (jobId: string) => {
    return rodinAI.downloadResult(jobId)
  }, [])

  const clearCompleted = useCallback(() => {
    rodinAI.clearCompleted()
    setJobs(rodinAI.getAllJobs())
    setActiveJobs(rodinAI.getAllJobs().filter(
      job => job.status === 'queued' || job.status === 'processing'
    ))
  }, [])

  return {
    jobs,
    activeJobs,
    isLoading,
    textTo3D,
    imageTo3D,
    synthesizeTexture,
    generativeEdit,
    getJobStatus,
    cancelJob,
    downloadResult,
    clearCompleted
  }
}
