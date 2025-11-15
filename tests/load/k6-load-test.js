/**
 * Production Load Testing with k6
 *
 * Simulates realistic user traffic to test system under load
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const requestCount = new Counter('requests')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 50 },    // Stay at 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '5m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],  // 95% under 2s, 99% under 5s
    'http_req_failed': ['rate<0.05'],                    // Error rate below 5%
    'errors': ['rate<0.05'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const API_URL = `${BASE_URL}/api`

export default function () {
  // Simulate user session
  group('Homepage Load', () => {
    const res = http.get(BASE_URL)
    check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage load time < 2s': (r) => r.timings.duration < 2000,
    })
    errorRate.add(res.status !== 200)
    requestCount.add(1)
    sleep(1)
  })

  group('API - Model Search', () => {
    const res = http.get(`${API_URL}/models?search=chair&limit=20`, {
      headers: { 'Content-Type': 'application/json' },
    })
    check(res, {
      'search status 200': (r) => r.status === 200,
      'search returns results': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.models && data.models.length > 0
        } catch {
          return false
        }
      },
      'search time < 500ms': (r) => r.timings.duration < 500,
    })
    apiDuration.add(res.timings.duration)
    errorRate.add(res.status !== 200)
    requestCount.add(1)
    sleep(0.5)
  })

  group('API - Model Details', () => {
    const res = http.get(`${API_URL}/models/model-chair-1`)
    check(res, {
      'detail status 200': (r) => r.status === 200,
      'detail has data': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.id !== undefined
        } catch {
          return false
        }
      },
    })
    apiDuration.add(res.timings.duration)
    errorRate.add(res.status !== 200)
    requestCount.add(1)
    sleep(1)
  })

  group('API - Project Create', () => {
    const payload = JSON.stringify({
      name: `Load Test Project ${Date.now()}`,
      description: 'Created during load test',
    })

    const res = http.post(`${API_URL}/projects`, payload, {
      headers: { 'Content-Type': 'application/json' },
    })

    check(res, {
      'create status 201': (r) => r.status === 201,
      'create returns id': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.id !== undefined
        } catch {
          return false
        }
      },
    })
    apiDuration.add(res.timings.duration)
    errorRate.add(res.status !== 201)
    requestCount.add(1)
    sleep(2)
  })

  group('AI Services - Lighting Analysis', () => {
    const payload = JSON.stringify({
      lights: [
        { type: 'point', position: { x: 0, y: 5, z: 0 }, intensity: 1.0 },
      ],
      cameraPosition: { x: 0, y: 1.6, z: 5 },
    })

    const res = http.post(`${API_URL}/ai/lighting/analyze`, payload, {
      headers: { 'Content-Type': 'application/json' },
    })

    check(res, {
      'lighting status 200': (r) => r.status === 200,
      'lighting returns score': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.overallScore !== undefined
        } catch {
          return false
        }
      },
      'lighting time < 1s': (r) => r.timings.duration < 1000,
    })
    apiDuration.add(res.timings.duration)
    errorRate.add(res.status !== 200)
    requestCount.add(1)
    sleep(1)
  })

  group('Vector Search', () => {
    const mockVector = Array(1536).fill(0).map(() => Math.random())

    const payload = JSON.stringify({
      vector: mockVector,
      topK: 10,
    })

    const res = http.post(`${API_URL}/search/vector`, payload, {
      headers: { 'Content-Type': 'application/json' },
    })

    check(res, {
      'vector search status 200': (r) => r.status === 200,
      'vector search time < 200ms': (r) => r.timings.duration < 200,
    })
    apiDuration.add(res.timings.duration)
    errorRate.add(res.status !== 200)
    requestCount.add(1)
    sleep(1)
  })

  // Simulate think time between actions
  sleep(Math.random() * 3 + 2) // 2-5 seconds
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed')
}
