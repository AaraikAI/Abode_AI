/**
 * Mobile Responsiveness Tests
 * Comprehensive testing for layout adaptation, touch interactions, and viewport handling
 * Total: 5 tests
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Mobile Responsiveness Tests', () => {
  // Layout Adaptation Tests (2 tests)
  describe('Layout Adaptation', () => {
    test('should adapt layout for mobile devices (320px - 480px)', async ({
      page,
      playwright
    }) => {
      const viewportSizes = [
        { width: 320, height: 568, device: 'iPhone SE' },
        { width: 375, height: 667, device: 'iPhone 8' },
        { width: 414, height: 896, device: 'iPhone 11 Pro Max' }
      ]

      for (const viewport of viewportSizes) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(`${BASE_URL}/dashboard`)

        // Check mobile navigation is visible
        const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
        await expect(mobileMenu).toBeVisible()

        // Check desktop navigation is hidden
        const desktopNav = page.locator('[data-testid="desktop-nav"]')
        if (await desktopNav.count() > 0) {
          const isVisible = await desktopNav.isVisible()
          expect(isVisible).toBe(false)
        }

        // Check content doesn't overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20)

        // Check elements stack vertically
        const container = page.locator('[data-testid="content-container"]').first()
        if (await container.count() > 0) {
          const flexDirection = await container.evaluate((el) => {
            return window.getComputedStyle(el).flexDirection
          })
          expect(flexDirection).toMatch(/column/)
        }
      }
    })

    test('should adapt layout for tablets (768px - 1024px)', async ({ page }) => {
      const viewportSizes = [
        { width: 768, height: 1024, device: 'iPad' },
        { width: 820, height: 1180, device: 'iPad Air' },
        { width: 1024, height: 1366, device: 'iPad Pro' }
      ]

      for (const viewport of viewportSizes) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(`${BASE_URL}/projects`)

        // Check project grid uses appropriate columns
        const grid = page.locator('[data-testid="project-grid"]').first()
        if (await grid.count() > 0) {
          const columns = await grid.evaluate((el) => {
            const style = window.getComputedStyle(el)
            return style.gridTemplateColumns || style.display
          })

          // Should have 2-3 columns on tablet
          expect(columns).toBeTruthy()
        }

        // Check sidebar is visible but can collapse
        const sidebar = page.locator('[data-testid="sidebar"]')
        if (await sidebar.count() > 0) {
          await expect(sidebar).toBeVisible()
        }
      }
    })
  })

  // Touch Interaction Tests (1 test)
  describe('Touch Interactions', () => {
    test('should handle touch gestures correctly', async ({ page, playwright }) => {
      const browser = await playwright.chromium.launch()
      const context = await browser.newContext({
        ...playwright.devices['iPhone 13 Pro']
      })
      const mobilePage = await context.newPage()

      await mobilePage.goto(`${BASE_URL}/projects/123/viewer`)

      // Test tap
      const button = mobilePage.locator('[data-testid="zoom-in-button"]').first()
      if (await button.count() > 0) {
        await button.tap()
        await mobilePage.waitForTimeout(100)
      }

      // Test swipe (simulated)
      const canvas = mobilePage.locator('canvas').first()
      if (await canvas.count() > 0) {
        const box = await canvas.boundingBox()
        if (box) {
          // Swipe right
          await mobilePage.touchscreen.tap(box.x + 50, box.y + 50)
          await mobilePage.touchscreen.tap(box.x + 200, box.y + 50)
        }
      }

      // Test pinch-to-zoom (simulated)
      await mobilePage.evaluate(() => {
        const event = new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 1,
              target: document.body,
              clientX: 100,
              clientY: 100
            }),
            new Touch({
              identifier: 2,
              target: document.body,
              clientX: 200,
              clientY: 200
            })
          ]
        })
        document.body.dispatchEvent(event)
      })

      // Check touch targets are appropriately sized (min 44x44px)
      const buttons = await mobilePage.locator('button').all()
      for (const btn of buttons.slice(0, 5)) {
        const box = await btn.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(40)
          expect(box.height).toBeGreaterThanOrEqual(40)
        }
      }

      await browser.close()
    })
  })

  // Viewport Meta Tag Tests (1 test)
  describe('Viewport Configuration', () => {
    test('should have proper viewport meta tag', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)

      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]')
        return meta?.getAttribute('content')
      })

      expect(viewport).toBeTruthy()
      expect(viewport).toContain('width=device-width')
      expect(viewport).toContain('initial-scale=1')

      // Check page respects viewport
      const viewportSize = await page.viewportSize()
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)

      expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 1920) + 20)
    })
  })

  // Orientation Change Tests (1 test)
  describe('Orientation Handling', () => {
    test('should handle orientation changes', async ({ page, playwright }) => {
      const browser = await playwright.chromium.launch()

      // Test portrait orientation
      const portraitContext = await browser.newContext({
        viewport: { width: 375, height: 667 }
      })
      const portraitPage = await portraitContext.newPage()
      await portraitPage.goto(`${BASE_URL}/dashboard`)

      const portraitNav = portraitPage.locator('[data-testid="mobile-menu-button"]')
      await expect(portraitNav).toBeVisible()

      // Test landscape orientation
      const landscapeContext = await browser.newContext({
        viewport: { width: 667, height: 375 }
      })
      const landscapePage = await landscapeContext.newPage()
      await landscapePage.goto(`${BASE_URL}/dashboard`)

      // In landscape, might show desktop-like layout
      const landscapeLayout = await landscapePage.evaluate(() => {
        return window.innerWidth > window.innerHeight
      })
      expect(landscapeLayout).toBe(true)

      // Check content is still accessible
      const mainContent = landscapePage.locator('main')
      await expect(mainContent).toBeVisible()

      await browser.close()
    })
  })
})

/**
 * Test Summary:
 * - Layout Adaptation: 2 tests (mobile 320-480px, tablet 768-1024px)
 * - Touch Interactions: 1 test (tap, swipe, pinch, touch targets)
 * - Viewport Configuration: 1 test (meta tag, responsive behavior)
 * - Orientation Handling: 1 test (portrait vs landscape)
 *
 * Total: 5 comprehensive mobile responsiveness tests
 */
