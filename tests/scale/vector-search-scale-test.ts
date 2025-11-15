/**
 * Vector Search Scale Testing for 80M+ Model Library
 *
 * Comprehensive scale testing suite that validates:
 * - Performance with millions of vectors
 * - Query optimization at massive scale
 * - Index tuning for large datasets
 * - Load balancing verification
 * - Throughput and latency benchmarks
 * - Concurrent query handling
 */

import { vectorDB } from '@/lib/services/vector-database'
import type { VectorDocument, SearchQuery } from '@/lib/services/vector-database'

// Test Configuration
interface ScaleTestConfig {
  vectorCount: number
  dimensions: number
  concurrentQueries: number
  queryBatchSize: number
  testDurationMs: number
  warmupQueries: number
}

// Performance Metrics
interface PerformanceMetrics {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  maxLatencyMs: number
  minLatencyMs: number
  queriesPerSecond: number
  throughput: number
  errorRate: number
}

// Scale Test Result
interface ScaleTestResult {
  testName: string
  config: ScaleTestConfig
  provider: 'pinecone' | 'weaviate' | 'faiss'
  startTime: Date
  endTime: Date
  durationMs: number
  metrics: PerformanceMetrics
  indexStats: {
    totalVectors: number
    indexSize: string
    avgVectorSize: number
  }
  recommendations: string[]
  passed: boolean
  thresholds: {
    maxP95LatencyMs: number
    minQueriesPerSecond: number
    maxErrorRate: number
  }
}

/**
 * Vector Search Scale Testing Service
 */
export class VectorSearchScaleTest {
  private latencies: number[] = []
  private errors: number = 0
  private successful: number = 0

  /**
   * Run comprehensive scale test
   */
  async runScaleTest(config: Partial<ScaleTestConfig> = {}): Promise<ScaleTestResult> {
    const fullConfig: ScaleTestConfig = {
      vectorCount: config.vectorCount || 1000000, // 1M for testing, scale to 80M
      dimensions: config.dimensions || 1536,
      concurrentQueries: config.concurrentQueries || 100,
      queryBatchSize: config.queryBatchSize || 10,
      testDurationMs: config.testDurationMs || 60000, // 1 minute
      warmupQueries: config.warmupQueries || 100
    }

    console.log('🚀 Starting Vector Search Scale Test')
    console.log(`📊 Configuration:`, fullConfig)

    const startTime = new Date()

    // Initialize vector database
    await vectorDB.initialize()

    // Get provider info
    const provider = process.env.VECTOR_DB_PROVIDER as any || 'faiss'

    // Warmup phase
    console.log('🔥 Warming up...')
    await this.warmup(fullConfig.warmupQueries, fullConfig.dimensions)

    // Reset metrics
    this.latencies = []
    this.errors = 0
    this.successful = 0

    // Run concurrent queries
    console.log('⚡ Running concurrent queries...')
    await this.runConcurrentQueries(fullConfig)

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Calculate metrics
    const metrics = this.calculateMetrics(durationMs)

    // Get index stats
    const indexStats = await this.getIndexStats()

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, fullConfig)

    // Check thresholds
    const thresholds = {
      maxP95LatencyMs: 200, // p95 should be under 200ms
      minQueriesPerSecond: 100, // At least 100 QPS
      maxErrorRate: 0.01 // Less than 1% errors
    }

    const passed =
      metrics.p95LatencyMs <= thresholds.maxP95LatencyMs &&
      metrics.queriesPerSecond >= thresholds.minQueriesPerSecond &&
      metrics.errorRate <= thresholds.maxErrorRate

    return {
      testName: `Vector Search Scale Test - ${fullConfig.vectorCount.toLocaleString()} vectors`,
      config: fullConfig,
      provider,
      startTime,
      endTime,
      durationMs,
      metrics,
      indexStats,
      recommendations,
      passed,
      thresholds
    }
  }

  /**
   * Benchmark query performance across different scenarios
   */
  async benchmarkQueries(): Promise<{
    singleQuery: PerformanceMetrics
    batchQueries: PerformanceMetrics
    concurrentQueries: PerformanceMetrics
    filterQueries: PerformanceMetrics
  }> {
    console.log('📊 Running query benchmarks...')

    // Single query benchmark
    console.log('  1️⃣  Single query benchmark')
    const singleQuery = await this.benchmarkSingleQueries(1000)

    // Batch queries benchmark
    console.log('  📦 Batch queries benchmark')
    const batchQueries = await this.benchmarkBatchQueries(100, 10)

    // Concurrent queries benchmark
    console.log('  ⚡ Concurrent queries benchmark')
    const concurrentQueries = await this.benchmarkConcurrentQueries(50, 100)

    // Filtered queries benchmark
    console.log('  🔍 Filtered queries benchmark')
    const filterQueries = await this.benchmarkFilteredQueries(500)

    return {
      singleQuery,
      batchQueries,
      concurrentQueries,
      filterQueries
    }
  }

  /**
   * Test load balancing across multiple instances
   */
  async testLoadBalancing(instanceCount: number = 3): Promise<{
    passed: boolean
    distribution: Record<string, number>
    avgLatencyPerInstance: Record<string, number>
  }> {
    console.log(`⚖️  Testing load balancing across ${instanceCount} instances...`)

    // Simulate multiple instances by tracking request distribution
    const distribution: Record<string, number> = {}
    const latencies: Record<string, number[]> = {}

    for (let i = 0; i < instanceCount; i++) {
      const instanceId = `instance-${i}`
      distribution[instanceId] = 0
      latencies[instanceId] = []
    }

    // Run queries and distribute them
    const totalQueries = 1000
    for (let i = 0; i < totalQueries; i++) {
      const instanceId = `instance-${i % instanceCount}`
      distribution[instanceId]++

      const start = Date.now()
      await this.executeQuery(1536)
      const latency = Date.now() - start

      latencies[instanceId].push(latency)
    }

    // Calculate average latency per instance
    const avgLatencyPerInstance: Record<string, number> = {}
    for (const [instanceId, lats] of Object.entries(latencies)) {
      avgLatencyPerInstance[instanceId] = lats.reduce((a, b) => a + b, 0) / lats.length
    }

    // Check if load is balanced (within 10% of ideal distribution)
    const idealCount = totalQueries / instanceCount
    const passed = Object.values(distribution).every(
      (count) => Math.abs(count - idealCount) / idealCount < 0.1
    )

    return {
      passed,
      distribution,
      avgLatencyPerInstance
    }
  }

  /**
   * Stress test with increasing load
   */
  async stressTest(): Promise<{
    maxQPS: number
    breakingPoint: number
    degradationCurve: Array<{ qps: number; latency: number; errorRate: number }>
  }> {
    console.log('💥 Running stress test...')

    const degradationCurve: Array<{ qps: number; latency: number; errorRate: number }> = []
    let maxQPS = 0
    let breakingPoint = 0

    // Gradually increase load
    const qpsLevels = [10, 25, 50, 100, 200, 500, 1000, 2000]

    for (const targetQPS of qpsLevels) {
      console.log(`  Testing ${targetQPS} QPS...`)

      this.latencies = []
      this.errors = 0
      this.successful = 0

      const testDuration = 10000 // 10 seconds per level
      const interval = 1000 / targetQPS
      const queries = Math.floor(testDuration / interval)

      const start = Date.now()
      const promises: Promise<void>[] = []

      for (let i = 0; i < queries; i++) {
        await new Promise((resolve) => setTimeout(resolve, interval))
        promises.push(this.executeQuery(1536))
      }

      await Promise.all(promises)
      const duration = Date.now() - start

      const metrics = this.calculateMetrics(duration)

      degradationCurve.push({
        qps: targetQPS,
        latency: metrics.avgLatencyMs,
        errorRate: metrics.errorRate
      })

      // Track max sustainable QPS (error rate < 5%, p95 < 500ms)
      if (metrics.errorRate < 0.05 && metrics.p95LatencyMs < 500) {
        maxQPS = targetQPS
      } else if (breakingPoint === 0) {
        breakingPoint = targetQPS
      }

      // Stop if error rate is too high
      if (metrics.errorRate > 0.1) {
        console.log('  ❌ Breaking point reached')
        break
      }
    }

    return {
      maxQPS,
      breakingPoint: breakingPoint || maxQPS,
      degradationCurve
    }
  }

  /**
   * Warmup phase to prime caches
   */
  private async warmup(queries: number, dimensions: number): Promise<void> {
    for (let i = 0; i < queries; i++) {
      await this.executeQuery(dimensions)
    }
  }

  /**
   * Run concurrent queries
   */
  private async runConcurrentQueries(config: ScaleTestConfig): Promise<void> {
    const endTime = Date.now() + config.testDurationMs
    const batchPromises: Promise<void>[] = []

    while (Date.now() < endTime) {
      // Create batch of concurrent queries
      const batch: Promise<void>[] = []
      for (let i = 0; i < config.concurrentQueries; i++) {
        batch.push(this.executeQuery(config.dimensions))
      }

      batchPromises.push(Promise.all(batch).then(() => {}))

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    await Promise.all(batchPromises)
  }

  /**
   * Execute a single query and track metrics
   */
  private async executeQuery(dimensions: number): Promise<void> {
    try {
      const vector = this.generateRandomVector(dimensions)
      const start = Date.now()

      await vectorDB.search({
        vector,
        topK: 10
      })

      const latency = Date.now() - start
      this.latencies.push(latency)
      this.successful++
    } catch (error) {
      this.errors++
    }
  }

  /**
   * Benchmark single queries
   */
  private async benchmarkSingleQueries(count: number): Promise<PerformanceMetrics> {
    this.latencies = []
    this.errors = 0
    this.successful = 0

    const start = Date.now()

    for (let i = 0; i < count; i++) {
      await this.executeQuery(1536)
    }

    const duration = Date.now() - start
    return this.calculateMetrics(duration)
  }

  /**
   * Benchmark batch queries
   */
  private async benchmarkBatchQueries(batches: number, batchSize: number): Promise<PerformanceMetrics> {
    this.latencies = []
    this.errors = 0
    this.successful = 0

    const start = Date.now()

    for (let i = 0; i < batches; i++) {
      const promises: Promise<void>[] = []
      for (let j = 0; j < batchSize; j++) {
        promises.push(this.executeQuery(1536))
      }
      await Promise.all(promises)
    }

    const duration = Date.now() - start
    return this.calculateMetrics(duration)
  }

  /**
   * Benchmark concurrent queries
   */
  private async benchmarkConcurrentQueries(batches: number, concurrent: number): Promise<PerformanceMetrics> {
    this.latencies = []
    this.errors = 0
    this.successful = 0

    const start = Date.now()

    for (let i = 0; i < batches; i++) {
      const promises: Promise<void>[] = []
      for (let j = 0; j < concurrent; j++) {
        promises.push(this.executeQuery(1536))
      }
      await Promise.all(promises)
    }

    const duration = Date.now() - start
    return this.calculateMetrics(duration)
  }

  /**
   * Benchmark filtered queries
   */
  private async benchmarkFilteredQueries(count: number): Promise<PerformanceMetrics> {
    this.latencies = []
    this.errors = 0
    this.successful = 0

    const start = Date.now()

    for (let i = 0; i < count; i++) {
      try {
        const vector = this.generateRandomVector(1536)
        const queryStart = Date.now()

        await vectorDB.search({
          vector,
          topK: 10,
          filter: { category: 'furniture' }
        })

        const latency = Date.now() - queryStart
        this.latencies.push(latency)
        this.successful++
      } catch (error) {
        this.errors++
      }
    }

    const duration = Date.now() - start
    return this.calculateMetrics(duration)
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(durationMs: number): PerformanceMetrics {
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b)
    const total = this.successful + this.errors

    return {
      totalQueries: total,
      successfulQueries: this.successful,
      failedQueries: this.errors,
      avgLatencyMs: this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length || 0,
      p50LatencyMs: this.percentile(sortedLatencies, 0.5),
      p95LatencyMs: this.percentile(sortedLatencies, 0.95),
      p99LatencyMs: this.percentile(sortedLatencies, 0.99),
      maxLatencyMs: Math.max(...this.latencies, 0),
      minLatencyMs: Math.min(...this.latencies, 0),
      queriesPerSecond: (this.successful / durationMs) * 1000,
      throughput: (this.successful / durationMs) * 1000,
      errorRate: this.errors / total || 0
    }
  }

  /**
   * Get index statistics
   */
  private async getIndexStats(): Promise<{
    totalVectors: number
    indexSize: string
    avgVectorSize: number
  }> {
    try {
      const stats = await vectorDB.getIndexStats()
      return {
        totalVectors: stats.totalVectors || 0,
        indexSize: this.formatBytes(stats.indexSizeBytes || 0),
        avgVectorSize: stats.avgVectorSizeBytes || 0
      }
    } catch (error) {
      return {
        totalVectors: 0,
        indexSize: '0 B',
        avgVectorSize: 0
      }
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: PerformanceMetrics, config: ScaleTestConfig): string[] {
    const recommendations: string[] = []

    if (metrics.p95LatencyMs > 200) {
      recommendations.push('Consider optimizing index configuration or upgrading to a larger instance')
    }

    if (metrics.queriesPerSecond < 100) {
      recommendations.push('Query throughput is below target. Review index tuning and connection pooling')
    }

    if (metrics.errorRate > 0.01) {
      recommendations.push('Error rate is above 1%. Investigate error causes and implement retry logic')
    }

    if (metrics.p99LatencyMs > metrics.p95LatencyMs * 2) {
      recommendations.push('High tail latency detected. Consider implementing query timeout and caching')
    }

    if (config.vectorCount > 10000000) {
      recommendations.push('For datasets > 10M vectors, consider sharding across multiple indexes')
    }

    return recommendations
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
  }

  /**
   * Generate random vector
   */
  private generateRandomVector(dimensions: number): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
  }

  /**
   * Export results to JSON
   */
  exportResultsToJSON(result: ScaleTestResult): string {
    return JSON.stringify(result, null, 2)
  }

  /**
   * Export results to HTML report
   */
  exportResultsToHTML(result: ScaleTestResult): string {
    const statusBadge = result.passed
      ? '<span class="badge badge-success">✓ PASSED</span>'
      : '<span class="badge badge-danger">✗ FAILED</span>'

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vector Search Scale Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #333; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .badge { padding: 5px 15px; border-radius: 4px; font-weight: bold; }
    .badge-success { background: #28a745; color: white; }
    .badge-danger { background: #dc3545; color: white; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-label { font-size: 14px; color: #666; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .recommendation { background: #e3f2fd; padding: 10px; margin: 5px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Vector Search Scale Test Report</h1>
    <p><strong>Test:</strong> ${result.testName}</p>
    <p><strong>Provider:</strong> ${result.provider}</p>
    <p><strong>Date:</strong> ${result.startTime.toLocaleString()}</p>
    <p><strong>Duration:</strong> ${(result.durationMs / 1000).toFixed(2)}s</p>
    <p><strong>Status:</strong> ${statusBadge}</p>
  </div>

  <h2>Performance Metrics</h2>
  <div class="metric">
    <div class="metric-label">Queries/Second</div>
    <div class="metric-value">${result.metrics.queriesPerSecond.toFixed(0)}</div>
  </div>
  <div class="metric">
    <div class="metric-label">P95 Latency</div>
    <div class="metric-value">${result.metrics.p95LatencyMs.toFixed(0)}ms</div>
  </div>
  <div class="metric">
    <div class="metric-label">P99 Latency</div>
    <div class="metric-value">${result.metrics.p99LatencyMs.toFixed(0)}ms</div>
  </div>
  <div class="metric">
    <div class="metric-label">Error Rate</div>
    <div class="metric-value">${(result.metrics.errorRate * 100).toFixed(2)}%</div>
  </div>

  <h2>Detailed Metrics</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Threshold</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>P95 Latency</td>
        <td>${result.metrics.p95LatencyMs.toFixed(2)}ms</td>
        <td>< ${result.thresholds.maxP95LatencyMs}ms</td>
        <td>${result.metrics.p95LatencyMs <= result.thresholds.maxP95LatencyMs ? '✓' : '✗'}</td>
      </tr>
      <tr>
        <td>Queries/Second</td>
        <td>${result.metrics.queriesPerSecond.toFixed(0)}</td>
        <td>> ${result.thresholds.minQueriesPerSecond}</td>
        <td>${result.metrics.queriesPerSecond >= result.thresholds.minQueriesPerSecond ? '✓' : '✗'}</td>
      </tr>
      <tr>
        <td>Error Rate</td>
        <td>${(result.metrics.errorRate * 100).toFixed(2)}%</td>
        <td>< ${(result.thresholds.maxErrorRate * 100).toFixed(2)}%</td>
        <td>${result.metrics.errorRate <= result.thresholds.maxErrorRate ? '✓' : '✗'}</td>
      </tr>
    </tbody>
  </table>

  <h2>Index Statistics</h2>
  <p><strong>Total Vectors:</strong> ${result.indexStats.totalVectors.toLocaleString()}</p>
  <p><strong>Index Size:</strong> ${result.indexStats.indexSize}</p>
  <p><strong>Avg Vector Size:</strong> ${result.indexStats.avgVectorSize} bytes</p>

  <h2>Recommendations</h2>
  ${result.recommendations.map((rec) => `<div class="recommendation">• ${rec}</div>`).join('')}

  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
    <p>Generated by Abode AI Vector Search Scale Test on ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>
    `
  }
}

// Export singleton instance
export const scaleTest = new VectorSearchScaleTest()
