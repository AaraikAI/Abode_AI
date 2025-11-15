/**
 * Visual Regression Tests
 *
 * Captures screenshots of key pages and components for Percy/Chromatic
 */

import { test, expect } from '@playwright/test'
import percySnapshot from '@percy/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Visual Regression Tests', () => {
  test.describe('Landing Pages', () => {
    test('Homepage', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 })
      await percySnapshot(page, 'Homepage')
    })

    test('Studio Page', async ({ page }) => {
      await page.goto(`${BASE_URL}/studio`)
      await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 })
      await percySnapshot(page, 'Studio - Empty State')
    })

    test('Dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, 'Dashboard')
    })
  })

  test.describe('Studio Features', () => {
    test('Studio with loaded model', async ({ page }) => {
      await page.goto(`${BASE_URL}/studio`)
      await page.waitForSelector('[data-testid="3d-canvas"]')

      // Add a model (mock interaction)
      await page.click('[data-testid="add-model-btn"]')
      await page.waitForTimeout(2000) // Wait for model to load

      await percySnapshot(page, 'Studio - With Model')
    })

    test('Material editor', async ({ page }) => {
      await page.goto(`${BASE_URL}/studio`)
      await page.waitForSelector('[data-testid="3d-canvas"]')

      // Open material editor
      await page.click('[data-testid="materials-tab"]')
      await page.waitForSelector('[data-testid="material-editor"]')

      await percySnapshot(page, 'Material Editor')
    })

    test('Lighting controls', async ({ page }) => {
      await page.goto(`${BASE_URL}/studio`)

      // Open lighting panel
      await page.click('[data-testid="lighting-tab"]')
      await page.waitForSelector('[data-testid="lighting-controls"]')

      await percySnapshot(page, 'Lighting Controls')
    })
  })

  test.describe('Components', () => {
    test('Model library', async ({ page }) => {
      await page.goto(`${BASE_URL}/library`)
      await page.waitForSelector('[data-testid="model-grid"]')
      await percySnapshot(page, 'Model Library')
    })

    test('Settings page', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, 'Settings')
    })

    test('Project list', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, 'Projects List')
    })
  })

  test.describe('Responsive', () => {
    test('Mobile - Homepage', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(BASE_URL)
      await page.waitForSelector('[data-testid="hero-section"]')
      await percySnapshot(page, 'Mobile - Homepage')
    })

    test('Mobile - Studio', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`${BASE_URL}/studio`)
      await page.waitForSelector('[data-testid="3d-canvas"]')
      await percySnapshot(page, 'Mobile - Studio')
    })

    test('Tablet - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, 'Tablet - Dashboard')
    })
  })

  test.describe('Dark Mode', () => {
    test('Homepage - Dark', async ({ page }) => {
      await page.goto(BASE_URL)
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForTimeout(500)
      await percySnapshot(page, 'Homepage - Dark Mode')
    })

    test('Studio - Dark', async ({ page }) => {
      await page.goto(`${BASE_URL}/studio`)
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForSelector('[data-testid="3d-canvas"]')
      await percySnapshot(page, 'Studio - Dark Mode')
    })
  })

  test.describe('Edge Cases', () => {
    test('Empty state - No projects', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects?empty=true`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, 'Projects - Empty State')
    })

    test('Error state - 404', async ({ page }) => {
      await page.goto(`${BASE_URL}/not-found-page`)
      await page.waitForLoadState('networkidle')
      await percySnapshot(page, '404 Error Page')
    })

    test('Loading state', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard?loading=true`)
      await page.waitForSelector('[data-testid="loading-spinner"]')
      await percySnapshot(page, 'Loading State')
    })
  })
})
