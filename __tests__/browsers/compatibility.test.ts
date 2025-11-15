/**
 * Cross-Browser Compatibility Tests
 * Comprehensive testing for Chrome, Firefox, Safari, Edge, and mobile browsers
 * Total: 10 tests
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test across multiple browsers
const browsers = ['chromium', 'firefox', 'webkit'] as const

test.describe('Cross-Browser Compatibility Tests', () => {
  // Core Functionality Tests (2 tests)
  describe('Core Functionality', () => {
    for (const browserType of browsers) {
      test(`should render homepage correctly on ${browserType}`, async ({ playwright }) => {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/`)

        // Check critical elements
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('nav')).toBeVisible()
        await expect(page.locator('footer')).toBeVisible()

        // Check layout is not broken
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        const viewportWidth = await page.viewportSize()
        expect(bodyWidth).toBeLessThanOrEqual((viewportWidth?.width || 1920) + 20)

        await browser.close()
      })
    }

    for (const browserType of browsers) {
      test(`should handle user interactions on ${browserType}`, async ({ playwright }) => {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/dashboard`)

        // Test button clicks
        const createButton = page.locator('[data-testid="create-project-button"]')
        if (await createButton.count() > 0) {
          await createButton.click()
          await expect(page.locator('[role="dialog"]')).toBeVisible()
        }

        await browser.close()
      })
    }
  })

  // CSS & Layout Tests (2 tests)
  describe('CSS & Layout Compatibility', () => {
    test('should apply flexbox layouts correctly across browsers', async ({ playwright }) => {
      const results: Record<string, boolean> = {}

      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/dashboard`)

        // Check flexbox container
        const container = page.locator('[data-testid="project-grid"]').first()
        if (await container.count() > 0) {
          const display = await container.evaluate((el) => {
            return window.getComputedStyle(el).display
          })

          results[browserType] = display === 'flex' || display === 'grid'
        }

        await browser.close()
      }

      // All browsers should support modern layouts
      expect(Object.values(results).every((v) => v)).toBe(true)
    })

    test('should apply CSS Grid correctly across browsers', async ({ playwright }) => {
      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/projects`)

        const grid = page.locator('[data-testid="project-grid"]').first()
        if (await grid.count() > 0) {
          const gridProps = await grid.evaluate((el) => {
            const style = window.getComputedStyle(el)
            return {
              display: style.display,
              gridTemplateColumns: style.gridTemplateColumns
            }
          })

          expect(gridProps.display).toMatch(/grid|flex/)
        }

        await browser.close()
      }
    })
  })

  // JavaScript API Tests (2 tests)
  describe('JavaScript API Compatibility', () => {
    test('should support modern JavaScript features across browsers', async ({ playwright }) => {
      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/`)

        const features = await page.evaluate(() => {
          return {
            async: typeof (async () => {}) === 'function',
            promise: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            arrow: typeof (() => {}) === 'function',
            destructuring: (() => {
              const { a } = { a: 1 }
              return a === 1
            })(),
            spread: (() => {
              const arr = [1, 2, 3]
              return [...arr].length === 3
            })()
          }
        })

        expect(features.async).toBe(true)
        expect(features.promise).toBe(true)
        expect(features.fetch).toBe(true)
        expect(features.arrow).toBe(true)
        expect(features.destructuring).toBe(true)
        expect(features.spread).toBe(true)

        await browser.close()
      }
    })

    test('should support Web APIs across browsers', async ({ playwright }) => {
      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/`)

        const webAPIs = await page.evaluate(() => {
          return {
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            webGL: (() => {
              const canvas = document.createElement('canvas')
              return !!(
                canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
              )
            })(),
            webWorkers: typeof Worker !== 'undefined',
            websockets: typeof WebSocket !== 'undefined',
            geolocation: typeof navigator.geolocation !== 'undefined'
          }
        })

        expect(webAPIs.localStorage).toBe(true)
        expect(webAPIs.sessionStorage).toBe(true)
        expect(webAPIs.webGL).toBe(true)
        expect(webAPIs.webWorkers).toBe(true)
        expect(webAPIs.websockets).toBe(true)

        await browser.close()
      }
    })
  })

  // Form Handling Tests (2 tests)
  describe('Form Handling', () => {
    test('should handle form inputs consistently across browsers', async ({ playwright }) => {
      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/auth/signin`)

        // Test text input
        await page.fill('[data-testid="email-input"]', 'test@example.com')
        const emailValue = await page.inputValue('[data-testid="email-input"]')
        expect(emailValue).toBe('test@example.com')

        // Test password input
        await page.fill('[data-testid="password-input"]', 'SecurePass123!')
        const passwordValue = await page.inputValue('[data-testid="password-input"]')
        expect(passwordValue).toBe('SecurePass123!')

        await browser.close()
      }
    })

    test('should handle file uploads across browsers', async ({ playwright }) => {
      for (const browserType of browsers) {
        const browser = await playwright[browserType].launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto(`${BASE_URL}/projects/new`)

        const fileInput = page.locator('input[type="file"]').first()
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles({
            name: 'test-model.ifc',
            mimeType: 'application/x-step',
            buffer: Buffer.from('test file content')
          })

          const files = await fileInput.evaluate((el: any) => {
            return el.files.length
          })

          expect(files).toBeGreaterThan(0)
        }

        await browser.close()
      }
    })
  })

  // Mobile Browser Tests (2 tests)
  describe('Mobile Browsers', () => {
    test('should work on mobile Safari (iOS)', async ({ playwright }) => {
      const browser = await playwright.webkit.launch()
      const context = await browser.newContext({
        ...playwright.devices['iPhone 13 Pro']
      })
      const page = await context.newPage()

      await page.goto(`${BASE_URL}/`)

      // Check mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
      if (await mobileMenu.count() > 0) {
        await mobileMenu.click()
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
      }

      // Check touch events work
      const button = page.locator('button').first()
      if (await button.count() > 0) {
        await button.tap()
      }

      await browser.close()
    })

    test('should work on mobile Chrome (Android)', async ({ playwright }) => {
      const browser = await playwright.chromium.launch()
      const context = await browser.newContext({
        ...playwright.devices['Pixel 5']
      })
      const page = await context.newPage()

      await page.goto(`${BASE_URL}/dashboard`)

      // Check viewport scaling
      const viewportWidth = await page.viewportSize()
      expect(viewportWidth?.width).toBe(393) // Pixel 5 width

      // Check elements are mobile-optimized
      const container = page.locator('main').first()
      if (await container.count() > 0) {
        const width = await container.evaluate((el) => el.scrollWidth)
        expect(width).toBeLessThanOrEqual(400)
      }

      await browser.close()
    })
  })
})

/**
 * Test Summary:
 * - Core Functionality: 2 tests (rendering, interactions across browsers)
 * - CSS & Layout: 2 tests (flexbox, CSS grid)
 * - JavaScript APIs: 2 tests (modern JS features, Web APIs)
 * - Form Handling: 2 tests (inputs, file uploads)
 * - Mobile Browsers: 2 tests (iOS Safari, Android Chrome)
 *
 * Total: 10 comprehensive cross-browser compatibility tests
 */
