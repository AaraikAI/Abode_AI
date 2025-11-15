/**
 * Test Utilities and Helpers
 * Production-quality testing utilities for Abode AI
 */

import { render, RenderResult } from '@testing-library/react'
import { ReactElement } from 'react'
import '@testing-library/jest-dom'

// Mock Data Generators
export class MockDataGenerator {
  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2)
  }

  static randomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  static randomEmail(): string {
    return `${this.randomString()}@test.com`
  }

  static randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  static randomDate(): Date {
    const start = new Date(2020, 0, 1)
    const end = new Date()
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  static randomCoordinates(): { lat: number; lon: number } {
    return {
      lat: this.randomNumber(-90, 90),
      lon: this.randomNumber(-180, 180)
    }
  }
}

// Test Fixtures
export class TestFixtures {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: MockDataGenerator.randomUUID(),
      email: MockDataGenerator.randomEmail(),
      username: MockDataGenerator.randomString(),
      name: 'Test User',
      createdAt: MockDataGenerator.randomDate(),
      ...overrides
    }
  }

  static createProject(overrides: Partial<any> = {}) {
    return {
      id: MockDataGenerator.randomUUID(),
      name: 'Test Project',
      description: 'Test Description',
      userId: MockDataGenerator.randomUUID(),
      createdAt: MockDataGenerator.randomDate(),
      ...overrides
    }
  }

  static createModel(overrides: Partial<any> = {}) {
    return {
      id: MockDataGenerator.randomUUID(),
      name: 'Test Model',
      category: 'furniture',
      fileUrl: 'https://example.com/model.glb',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      dimensions: { width: 100, height: 100, depth: 100 },
      ...overrides
    }
  }

  static createRenderJob(overrides: Partial<any> = {}) {
    return {
      id: MockDataGenerator.randomUUID(),
      projectId: MockDataGenerator.randomUUID(),
      status: 'pending',
      settings: { quality: 'high', resolution: '1920x1080' },
      createdAt: MockDataGenerator.randomDate(),
      ...overrides
    }
  }
}

// API Mocking Utilities
export class APIMock {
  static mockFetch(response: any, options: { status?: number; delay?: number } = {}) {
    const { status = 200, delay = 0 } = options

    return jest.fn().mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: status >= 200 && status < 300,
              status,
              json: async () => response,
              text: async () => JSON.stringify(response)
            }),
          delay
        )
      )
    )
  }

  static mockFetchError(error: string) {
    return jest.fn().mockRejectedValue(new Error(error))
  }

  static mockSupabaseQuery(data: any) {
    return {
      data,
      error: null,
      count: Array.isArray(data) ? data.length : 1,
      status: 200,
      statusText: 'OK'
    }
  }

  static mockSupabaseError(message: string) {
    return {
      data: null,
      error: { message },
      count: 0,
      status: 400,
      statusText: 'Bad Request'
    }
  }
}

// Component Testing Utilities
export class ComponentTestUtils {
  static renderWithProviders(ui: ReactElement): RenderResult {
    return render(ui)
  }

  static async waitForLoadingToFinish(container: HTMLElement) {
    const loadingElements = container.querySelectorAll('[data-testid="loading"]')
    if (loadingElements.length === 0) return

    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

// Assertion Helpers
export class AssertionHelpers {
  static assertValidUUID(value: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(value).toMatch(uuidRegex)
  }

  static assertValidEmail(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(value).toMatch(emailRegex)
  }

  static assertValidDate(value: any) {
    expect(value).toBeInstanceOf(Date)
    expect(value.getTime()).not.toBeNaN()
  }

  static assertValidCoordinates(coords: { lat: number; lon: number }) {
    expect(coords.lat).toBeGreaterThanOrEqual(-90)
    expect(coords.lat).toBeLessThanOrEqual(90)
    expect(coords.lon).toBeGreaterThanOrEqual(-180)
    expect(coords.lon).toBeLessThanOrEqual(180)
  }
}

// Performance Testing Utilities
export class PerformanceTestUtils {
  static async measureExecutionTime(fn: () => Promise<any>): Promise<number> {
    const start = performance.now()
    await fn()
    return performance.now() - start
  }

  static async assertExecutionTime(fn: () => Promise<any>, maxMs: number) {
    const time = await this.measureExecutionTime(fn)
    expect(time).toBeLessThan(maxMs)
  }
}

// Database Testing Utilities
export class DatabaseTestUtils {
  static async cleanupDatabase() {
    // Implement database cleanup logic
  }

  static async seedTestData() {
    // Implement test data seeding
  }
}
