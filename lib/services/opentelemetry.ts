/**
 * OpenTelemetry Distributed Tracing Service
 *
 * Distributed tracing, metrics, and logging using OpenTelemetry
 * Exports to Jaeger for traces and Prometheus for metrics
 */

export interface TelemetryConfig {
  serviceName: string
  serviceVersion: string
  environment: string
  collectorEndpoint: string
  enableTracing?: boolean
  enableMetrics?: boolean
  enableLogging?: boolean
  sampleRate?: number
}

export interface SpanOptions {
  name: string
  attributes?: Record<string, string | number | boolean>
  kind?: 'client' | 'server' | 'internal' | 'producer' | 'consumer'
}

export interface Span {
  id: string
  traceId: string
  parentId?: string
  name: string
  startTime: number
  endTime?: number
  attributes: Record<string, any>
  events: SpanEvent[]
  status: 'ok' | 'error' | 'unset'
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: Record<string, any>
}

export interface MetricOptions {
  name: string
  value: number
  unit?: string
  attributes?: Record<string, string | number | boolean>
  timestamp?: number
}

export interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram'
  value: number
  unit?: string
  attributes: Record<string, any>
  timestamp: number
}

export class OpenTelemetryService {
  private config: Required<TelemetryConfig>
  private activeSpans: Map<string, Span> = new Map()
  private metrics: Map<string, Metric> = new Map()
  private traceIdCounter = 0
  private spanIdCounter = 0

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      serviceName: config.serviceName || 'abode-ai',
      serviceVersion: config.serviceVersion || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      collectorEndpoint: config.collectorEndpoint || 'http://localhost:4318',
      enableTracing: config.enableTracing !== false,
      enableMetrics: config.enableMetrics !== false,
      enableLogging: config.enableLogging !== false,
      sampleRate: config.sampleRate || 1.0
    }

    this.initialize()
  }

  /**
   * Initialize OpenTelemetry SDK
   */
  private initialize(): void {
    if (typeof window === 'undefined') {
      console.log('[OpenTelemetry] Initialized with config:', {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        collectorEndpoint: this.config.collectorEndpoint
      })
    }
  }

  /**
   * Start a new span for distributed tracing
   */
  startSpan(options: SpanOptions): string {
    if (!this.config.enableTracing) return ''

    // Sample based on sample rate
    if (Math.random() > this.config.sampleRate) return ''

    const spanId = this.generateSpanId()
    const traceId = this.generateTraceId()

    const span: Span = {
      id: spanId,
      traceId,
      name: options.name,
      startTime: Date.now(),
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
        ...options.attributes
      },
      events: [],
      status: 'unset'
    }

    this.activeSpans.set(spanId, span)
    this.sendSpanToCollector(span)

    return spanId
  }

  /**
   * End an active span
   */
  endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    const span = this.activeSpans.get(spanId)
    if (!span) return

    span.endTime = Date.now()
    span.status = status

    this.sendSpanToCollector(span)
    this.activeSpans.delete(spanId)
  }

  /**
   * Add an event to an active span
   */
  addSpanEvent(spanId: string, name: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId)
    if (!span) return

    span.events.push({
      name,
      timestamp: Date.now(),
      attributes
    })
  }

  /**
   * Set span attribute
   */
  setSpanAttribute(spanId: string, key: string, value: any): void {
    const span = this.activeSpans.get(spanId)
    if (!span) return

    span.attributes[key] = value
  }

  /**
   * Create a child span
   */
  startChildSpan(parentSpanId: string, options: SpanOptions): string {
    const parentSpan = this.activeSpans.get(parentSpanId)
    if (!parentSpan) return this.startSpan(options)

    const spanId = this.generateSpanId()

    const span: Span = {
      id: spanId,
      traceId: parentSpan.traceId,
      parentId: parentSpanId,
      name: options.name,
      startTime: Date.now(),
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
        ...options.attributes
      },
      events: [],
      status: 'unset'
    }

    this.activeSpans.set(spanId, span)
    this.sendSpanToCollector(span)

    return spanId
  }

  /**
   * Wrap async function with tracing
   */
  async trace<T>(
    name: string,
    fn: (spanId: string) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const spanId = this.startSpan({ name, attributes })

    try {
      const result = await fn(spanId)
      this.endSpan(spanId, 'ok')
      return result
    } catch (error) {
      this.setSpanAttribute(spanId, 'error', true)
      this.setSpanAttribute(spanId, 'error.message', error instanceof Error ? error.message : String(error))
      this.endSpan(spanId, 'error')
      throw error
    }
  }

  /**
   * Record a metric
   */
  recordMetric(options: MetricOptions): void {
    if (!this.config.enableMetrics) return

    const metric: Metric = {
      name: options.name,
      type: 'gauge',
      value: options.value,
      unit: options.unit,
      attributes: {
        'service.name': this.config.serviceName,
        'deployment.environment': this.config.environment,
        ...options.attributes
      },
      timestamp: options.timestamp || Date.now()
    }

    this.metrics.set(options.name, metric)
    this.sendMetricToCollector(metric)
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, attributes?: Record<string, any>): void {
    const existing = this.metrics.get(name)
    const newValue = existing ? existing.value + value : value

    this.recordMetric({
      name,
      value: newValue,
      attributes
    })
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, attributes?: Record<string, any>): void {
    this.recordMetric({
      name,
      value,
      attributes
    })
  }

  /**
   * Get current trace context for propagation
   */
  getTraceContext(spanId: string): Record<string, string> | null {
    const span = this.activeSpans.get(spanId)
    if (!span) return null

    return {
      'traceparent': `00-${span.traceId}-${span.id}-01`,
      'tracestate': `abode=${span.id}`
    }
  }

  /**
   * Extract trace context from headers
   */
  extractTraceContext(headers: Record<string, string>): {
    traceId: string
    spanId: string
  } | null {
    const traceparent = headers['traceparent']
    if (!traceparent) return null

    const parts = traceparent.split('-')
    if (parts.length < 4) return null

    return {
      traceId: parts[1],
      spanId: parts[2]
    }
  }

  /**
   * Send span to OpenTelemetry collector
   */
  private async sendSpanToCollector(span: Span): Promise<void> {
    if (typeof window !== 'undefined') return // Skip browser for now

    try {
      const payload = {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: this.config.serviceName } },
              { key: 'service.version', value: { stringValue: this.config.serviceVersion } },
              { key: 'deployment.environment', value: { stringValue: this.config.environment } }
            ]
          },
          scopeSpans: [{
            scope: {
              name: 'abode-ai-tracer',
              version: '1.0.0'
            },
            spans: [{
              traceId: this.hexToBase64(span.traceId),
              spanId: this.hexToBase64(span.id),
              parentSpanId: span.parentId ? this.hexToBase64(span.parentId) : undefined,
              name: span.name,
              kind: 1, // INTERNAL
              startTimeUnixNano: String(span.startTime * 1000000),
              endTimeUnixNano: span.endTime ? String(span.endTime * 1000000) : undefined,
              attributes: Object.entries(span.attributes).map(([key, value]) => ({
                key,
                value: this.getAttributeValue(value)
              })),
              events: span.events.map(event => ({
                name: event.name,
                timeUnixNano: String(event.timestamp * 1000000),
                attributes: event.attributes ? Object.entries(event.attributes).map(([key, value]) => ({
                  key,
                  value: this.getAttributeValue(value)
                })) : []
              })),
              status: {
                code: span.status === 'ok' ? 1 : span.status === 'error' ? 2 : 0
              }
            }]
          }]
        }]
      }

      await fetch(`${this.config.collectorEndpoint}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('[OpenTelemetry] Failed to send span:', error)
    }
  }

  /**
   * Send metric to OpenTelemetry collector
   */
  private async sendMetricToCollector(metric: Metric): Promise<void> {
    if (typeof window !== 'undefined') return

    try {
      const payload = {
        resourceMetrics: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: this.config.serviceName } },
              { key: 'deployment.environment', value: { stringValue: this.config.environment } }
            ]
          },
          scopeMetrics: [{
            scope: {
              name: 'abode-ai-meter',
              version: '1.0.0'
            },
            metrics: [{
              name: metric.name,
              unit: metric.unit || '',
              gauge: {
                dataPoints: [{
                  timeUnixNano: String(metric.timestamp * 1000000),
                  asDouble: metric.value,
                  attributes: Object.entries(metric.attributes).map(([key, value]) => ({
                    key,
                    value: this.getAttributeValue(value)
                  }))
                }]
              }
            }]
          }]
        }]
      }

      await fetch(`${this.config.collectorEndpoint}/v1/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('[OpenTelemetry] Failed to send metric:', error)
    }
  }

  /**
   * Helper to convert attribute value to OTLP format
   */
  private getAttributeValue(value: any): any {
    if (typeof value === 'string') {
      return { stringValue: value }
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value }
    } else if (typeof value === 'boolean') {
      return { boolValue: value }
    } else {
      return { stringValue: String(value) }
    }
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    this.traceIdCounter++
    const timestamp = Date.now().toString(16).padStart(16, '0')
    const random = Math.random().toString(16).substring(2, 18).padStart(16, '0')
    return timestamp + random
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    this.spanIdCounter++
    return Math.random().toString(16).substring(2, 18).padStart(16, '0')
  }

  /**
   * Convert hex string to base64
   */
  private hexToBase64(hex: string): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(hex, 'hex').toString('base64')
    }
    // Fallback for browser
    return btoa(hex.match(/\w{2}/g)?.map((a) => String.fromCharCode(parseInt(a, 16))).join('') || '')
  }

  /**
   * Get all active spans (for debugging)
   */
  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values())
  }

  /**
   * Get all metrics (for debugging)
   */
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values())
  }
}

// Singleton export
export const openTelemetry = new OpenTelemetryService()
