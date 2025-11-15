/**
 * Visual Regression Tests for Pages
 *
 * Tests visual appearance of all major pages across different viewports
 */

import { test, expect, waitForPercy, takeResponsiveSnapshots, mockApiResponses, freezeTime } from './setup'
import percySnapshot from '@percy/playwright'

test.describe('Page Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for all tests
    await mockApiResponses(page)
    await freezeTime(page)
  })

  test('Homepage', async ({ page }) => {
    await page.goto('/')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Homepage')
  })

  test('Dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Dashboard')
  })

  test('Projects List', async ({ page }) => {
    await page.goto('/projects')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Projects List')

    // Test with filters applied
    await page.click('[data-testid="filter-active"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Projects List - Filtered')

    // Test with search
    await page.fill('[data-testid="search-input"]', 'test')
    await waitForPercy(page)
    await percySnapshot(page, 'Projects List - Search')
  })

  test('Project Detail', async ({ page }) => {
    await page.goto('/projects/1')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Project Detail')

    // Test different tabs
    const tabs = ['overview', 'models', 'renders', 'settings']
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`)
      await waitForPercy(page)
      await percySnapshot(page, `Project Detail - ${tab} tab`)
    }
  })

  test('Model Library', async ({ page }) => {
    await page.goto('/models')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Model Library')

    // Test grid vs list view
    await page.click('[data-testid="view-list"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Model Library - List View')

    await page.click('[data-testid="view-grid"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Model Library - Grid View')
  })

  test('Rendering Queue', async ({ page }) => {
    await page.goto('/rendering')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Rendering Queue')

    // Test with active renders
    await page.click('[data-testid="start-render"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Rendering Queue - Active')
  })

  test('Collaboration', async ({ page }) => {
    await page.goto('/collaboration')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Collaboration')
  })

  test('Settings', async ({ page }) => {
    await page.goto('/settings')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Settings')

    // Test different settings sections
    const sections = ['profile', 'preferences', 'billing', 'api']
    for (const section of sections) {
      await page.click(`[data-section="${section}"]`)
      await waitForPercy(page)
      await percySnapshot(page, `Settings - ${section}`)
    }
  })

  test('Analytics Dashboard', async ({ page }) => {
    await page.goto('/analytics')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Analytics')

    // Test different time ranges
    await page.click('[data-testid="timerange-week"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Analytics - Weekly')

    await page.click('[data-testid="timerange-month"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Analytics - Monthly')
  })

  test('Marketplace', async ({ page }) => {
    await page.goto('/marketplace')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Marketplace')

    // Test category filtering
    await page.click('[data-category="furniture"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Marketplace - Furniture Category')
  })

  test('Error Pages', async ({ page }) => {
    // 404 Page
    await page.goto('/non-existent-page')
    await waitForPercy(page)
    await percySnapshot(page, '404 Error Page')

    // Could test other error pages if they exist
  })
})

test.describe('Authentication Pages', () => {
  test('Login Page', async ({ page }) => {
    await page.goto('/login')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Login Page')

    // Test with validation errors
    await page.click('[data-testid="submit"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Login Page - Validation Errors')
  })

  test('Signup Page', async ({ page }) => {
    await page.goto('/signup')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Signup Page')
  })

  test('Forgot Password', async ({ page }) => {
    await page.goto('/forgot-password')
    await waitForPercy(page)

    await takeResponsiveSnapshots(page, percySnapshot, 'Forgot Password')
  })
})

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
  })

  test('Dashboard - Dark Mode', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForPercy(page)

    await percySnapshot(page, 'Dashboard - Dark Mode')
  })

  test('Projects - Dark Mode', async ({ page }) => {
    await page.goto('/projects')
    await waitForPercy(page)

    await percySnapshot(page, 'Projects - Dark Mode')
  })

  test('Settings - Dark Mode', async ({ page }) => {
    await page.goto('/settings')
    await waitForPercy(page)

    await percySnapshot(page, 'Settings - Dark Mode')
  })
})

test.describe('Accessibility States', () => {
  test('High Contrast Mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })

    await page.goto('/dashboard')
    await waitForPercy(page)

    await percySnapshot(page, 'Dashboard - High Contrast')
  })

  test('Reduced Motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/dashboard')
    await waitForPercy(page)

    await percySnapshot(page, 'Dashboard - Reduced Motion')
  })
})
