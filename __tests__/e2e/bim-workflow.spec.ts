/**
 * BIM Workflow E2E Tests
 * Complete end-to-end workflow testing for BIM/IFC features
 * Total: 10 tests
 *
 * Workflow: IFC import → Navigate elements → Clash detection → Export
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('BIM Workflow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', TEST_USER.email)
    await page.fill('[data-testid="password-input"]', TEST_USER.password)
    await page.click('[data-testid="signin-button"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test.afterEach(async () => {
    await page.close()
  })

  // IFC Import Tests (2 tests)
  test('should import IFC file', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')

    await page.click('[data-testid="import-ifc-button"]')

    const fileInput = page.locator('[data-testid="ifc-file-input"]')
    await fileInput.setInputFiles({
      name: 'building-model.ifc',
      mimeType: 'application/x-step',
      buffer: Buffer.from('ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;')
    })

    await page.click('[data-testid="start-import-button"]')
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="import-complete-toast"]')).toBeVisible({ timeout: 15000 })
  })

  test('should validate IFC schema', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="validate-ifc-button"]')
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="schema-version"]')).toContainText(/IFC\d+/)
    await expect(page.locator('[data-testid="validation-status"]')).toContainText(/Valid|Warning/)
  })

  // Element Navigation Tests (3 tests)
  test('should navigate element tree', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="element-tree-button"]')
    await expect(page.locator('[data-testid="element-tree-panel"]')).toBeVisible()

    // Expand building structure
    await page.click('[data-testid="tree-node-IfcBuilding"]')
    await page.click('[data-testid="tree-node-IfcBuildingStorey"]')

    const elements = page.locator('[data-testid^="tree-node-IfcWall"]')
    await expect(elements).toHaveCount(3, { timeout: 5000 })
  })

  test('should select and inspect elements', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    // Select element from tree
    await page.click('[data-testid="tree-node-IfcWall-1"]')

    // Check properties panel
    await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="element-guid"]')).toBeVisible()
    await expect(page.locator('[data-testid="element-type"]')).toContainText('IfcWall')

    // Check properties
    await expect(page.locator('[data-testid="property-name"]')).toContainText(/Name|Height|Width/)
  })

  test('should filter elements by type', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="filter-button"]')
    await page.check('[data-testid="filter-ifcwall"]')
    await page.uncheck('[data-testid="filter-ifcslab"]')
    await page.click('[data-testid="apply-filter-button"]')

    const visibleElements = page.locator('[data-testid="visible-element"]')
    await expect(visibleElements).toHaveCount(3, { timeout: 5000 })
  })

  // Clash Detection Tests (3 tests)
  test('should run clash detection', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="clash-detection-button"]')
    await page.click('[data-testid="run-clash-detection-button"]')

    await expect(page.locator('[data-testid="clash-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="clash-results"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="clash-count"]')).toContainText(/\d+ clashes/)
  })

  test('should inspect clash details', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="clash-detection-button"]')
    await page.click('[data-testid="clash-item"]:first-child')

    await expect(page.locator('[data-testid="clash-details-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="clash-element-a"]')).toBeVisible()
    await expect(page.locator('[data-testid="clash-element-b"]')).toBeVisible()
    await expect(page.locator('[data-testid="clash-type"]')).toContainText(/Hard Clash|Soft Clash/)

    // Zoom to clash
    await page.click('[data-testid="zoom-to-clash-button"]')
    await expect(page.locator('[data-testid="clash-highlight"]')).toBeVisible()
  })

  test('should resolve and track clashes', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="clash-detection-button"]')
    await page.click('[data-testid="clash-item"]:first-child')

    // Mark as resolved
    await page.click('[data-testid="resolve-clash-button"]')
    await page.fill('[data-testid="resolution-notes"]', 'Wall height adjusted')
    await page.click('[data-testid="save-resolution-button"]')

    await expect(page.locator('[data-testid="clash-item"]:first-child')).toHaveClass(/resolved/)
  })

  // IFC Export Tests (2 tests)
  test('should export modified IFC', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="export-ifc-button"]')
    await page.selectOption('[data-testid="ifc-version-select"]', 'IFC4')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="start-export-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/.*\.ifc$/)
  })

  test('should export BCF for clash coordination', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/bim`)

    await page.click('[data-testid="clash-detection-button"]')
    await page.click('[data-testid="export-bcf-button"]')

    // Select clashes to export
    await page.check('[data-testid="clash-checkbox"]:nth-child(1)')
    await page.check('[data-testid="clash-checkbox"]:nth-child(2)')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-bcf-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/.*\.bcf(zip)?$/)
  })
})

/**
 * Test Summary:
 * - IFC Import: 2 tests (import file, validate schema)
 * - Element Navigation: 3 tests (tree navigation, inspect elements, filter by type)
 * - Clash Detection: 3 tests (run detection, inspect clashes, resolve/track)
 * - IFC Export: 2 tests (export modified IFC, export BCF)
 *
 * Total: 10 comprehensive E2E tests covering BIM workflow
 */
