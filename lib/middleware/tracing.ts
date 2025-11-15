/**
 * OpenTelemetry Tracing Middleware
 *
 * Automatic tracing for Next.js API routes and server-side operations
 */

import { openTelemetry } from '@/lib/services/opentelemetry'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to automatically trace Next.js API routes
 */
export function withTracing(
  handler: (req: NextRequest) => Promise<NextResponse>,
  spanName?: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const name = spanName || `${req.method} ${req.nextUrl.pathname}`

    // Extract trace context from headers if present
    const traceContext = openTelemetry.extractTraceContext({
      traceparent: req.headers.get('traceparent') || '',
      tracestate: req.headers.get('tracestate') || ''
    })

    return await openTelemetry.trace(
      name,
      async (spanId) => {
        // Add request attributes to span
        openTelemetry.setSpanAttribute(spanId, 'http.method', req.method)
        openTelemetry.setSpanAttribute(spanId, 'http.url', req.nextUrl.toString())
        openTelemetry.setSpanAttribute(spanId, 'http.route', req.nextUrl.pathname)
        openTelemetry.setSpanAttribute(spanId, 'http.user_agent', req.headers.get('user-agent') || '')

        if (traceContext) {
          openTelemetry.setSpanAttribute(spanId, 'trace.parent_trace_id', traceContext.traceId)
          openTelemetry.setSpanAttribute(spanId, 'trace.parent_span_id', traceContext.spanId)
        }

        // Execute handler
        const startTime = Date.now()
        try {
          const response = await handler(req)

          // Add response attributes
          const duration = Date.now() - startTime
          openTelemetry.setSpanAttribute(spanId, 'http.status_code', response.status)
          openTelemetry.setSpanAttribute(spanId, 'http.response_time_ms', duration)

          // Record metric
          openTelemetry.recordHistogram('http.server.duration', duration, {
            method: req.method,
            route: req.nextUrl.pathname,
            status: response.status
          })

          // Add trace context to response headers
          const traceContext = openTelemetry.getTraceContext(spanId)
          if (traceContext) {
            response.headers.set('traceparent', traceContext.traceparent)
            if (traceContext.tracestate) {
              response.headers.set('tracestate', traceContext.tracestate)
            }
          }

          return response
        } catch (error) {
          // Add error attributes
          const duration = Date.now() - startTime
          openTelemetry.setSpanAttribute(spanId, 'error', true)
          openTelemetry.setSpanAttribute(spanId, 'error.type', error instanceof Error ? error.name : 'Error')
          openTelemetry.setSpanAttribute(spanId, 'error.message', error instanceof Error ? error.message : String(error))
          openTelemetry.setSpanAttribute(spanId, 'http.response_time_ms', duration)

          // Record error metric
          openTelemetry.incrementCounter('http.server.errors', 1, {
            method: req.method,
            route: req.nextUrl.pathname,
            error_type: error instanceof Error ? error.name : 'Error'
          })

          throw error
        }
      },
      {
        'span.kind': 'server'
      }
    )
  }
}

/**
 * Trace a database query
 */
export async function traceQuery<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return await openTelemetry.trace(
    `db.${operation}`,
    async (spanId) => {
      openTelemetry.setSpanAttribute(spanId, 'db.system', 'postgresql')
      openTelemetry.setSpanAttribute(spanId, 'db.operation', operation)
      openTelemetry.setSpanAttribute(spanId, 'db.table', table)

      const startTime = Date.now()
      try {
        const result = await fn()
        const duration = Date.now() - startTime

        openTelemetry.setSpanAttribute(spanId, 'db.duration_ms', duration)
        openTelemetry.recordHistogram('db.query.duration', duration, {
          operation,
          table
        })

        return result
      } catch (error) {
        openTelemetry.setSpanAttribute(spanId, 'error', true)
        openTelemetry.setSpanAttribute(spanId, 'error.message', error instanceof Error ? error.message : String(error))
        openTelemetry.incrementCounter('db.query.errors', 1, { operation, table })
        throw error
      }
    },
    {
      'span.kind': 'client'
    }
  )
}

/**
 * Trace an external HTTP call
 */
export async function traceHttpCall<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  return await openTelemetry.trace(
    `http.${method}`,
    async (spanId) => {
      openTelemetry.setSpanAttribute(spanId, 'http.method', method)
      openTelemetry.setSpanAttribute(spanId, 'http.url', url)

      // Add trace context to outgoing request
      const traceContext = openTelemetry.getTraceContext(spanId)

      const startTime = Date.now()
      try {
        const result = await fn()
        const duration = Date.now() - startTime

        openTelemetry.setSpanAttribute(spanId, 'http.duration_ms', duration)
        openTelemetry.recordHistogram('http.client.duration', duration, {
          method,
          url
        })

        return result
      } catch (error) {
        openTelemetry.setSpanAttribute(spanId, 'error', true)
        openTelemetry.setSpanAttribute(spanId, 'error.message', error instanceof Error ? error.message : String(error))
        openTelemetry.incrementCounter('http.client.errors', 1, { method, url })
        throw error
      }
    },
    {
      'span.kind': 'client'
    }
  )
}

/**
 * Trace a background job
 */
export async function traceJob<T>(
  jobName: string,
  jobId: string,
  fn: () => Promise<T>
): Promise<T> {
  return await openTelemetry.trace(
    `job.${jobName}`,
    async (spanId) => {
      openTelemetry.setSpanAttribute(spanId, 'job.name', jobName)
      openTelemetry.setSpanAttribute(spanId, 'job.id', jobId)

      const startTime = Date.now()
      try {
        openTelemetry.addSpanEvent(spanId, 'job.started')
        const result = await fn()
        const duration = Date.now() - startTime

        openTelemetry.addSpanEvent(spanId, 'job.completed')
        openTelemetry.setSpanAttribute(spanId, 'job.duration_ms', duration)
        openTelemetry.recordHistogram('job.duration', duration, { job_name: jobName })

        return result
      } catch (error) {
        openTelemetry.addSpanEvent(spanId, 'job.failed', {
          error: error instanceof Error ? error.message : String(error)
        })
        openTelemetry.setSpanAttribute(spanId, 'error', true)
        openTelemetry.incrementCounter('job.failures', 1, { job_name: jobName })
        throw error
      }
    },
    {
      'span.kind': 'internal'
    }
  )
}
