/**
 * Cost Estimation Workflow E2E Tests
 * Complete end-to-end workflow testing for cost estimation features
 * Total: 10 tests
 *
 * Workflow: Material selection → Labor calculation → Regional pricing → Export report
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('Cost Estimation Workflow E2E Tests', () => {
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

  // Material Selection Tests (3 tests)
  test('should perform material takeoff', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="cost-estimation-button"]')

    // Start material takeoff
    await page.click('[data-testid="material-takeoff-tab"]')
    await page.click('[data-testid="auto-detect-materials-button"]')

    await expect(page.locator('[data-testid="material-list-item"]')).toHaveCount(3, { timeout: 10000 })
    await expect(page.locator('[data-testid="total-materials"]')).toContainText(/\d+/)
  })

  test('should add custom materials', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="add-material-button"]')
    await page.fill('[data-testid="material-name-input"]', 'Custom Tile')
    await page.fill('[data-testid="material-quantity-input"]', '500')
    await page.selectOption('[data-testid="material-unit-select"]', 'sqft')
    await page.fill('[data-testid="material-cost-input"]', '5.50')
    await page.click('[data-testid="save-material-button"]')

    await expect(page.locator('[data-testid="material-list"]')).toContainText('Custom Tile')
  })

  test('should edit material quantities', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    const materialItem = page.locator('[data-testid="material-list-item"]:first-child')
    await materialItem.click()
    await page.fill('[data-testid="quantity-input"]', '750')
    await page.click('[data-testid="update-quantity-button"]')

    await expect(page.locator('[data-testid="total-cost"]')).toContainText(/\$[\d,]+/)
  })

  // Labor Calculation Tests (2 tests)
  test('should calculate labor costs', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="labor-tab"]')
    await page.click('[data-testid="auto-calculate-labor-button"]')

    await expect(page.locator('[data-testid="labor-category"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.locator('[data-testid="total-labor-cost"]')).toContainText(/\$[\d,]+/)
  })

  test('should add custom labor items', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="labor-tab"]')
    await page.click('[data-testid="add-labor-button"]')
    await page.fill('[data-testid="labor-category-input"]', 'Electrical Work')
    await page.fill('[data-testid="labor-hours-input"]', '40')
    await page.fill('[data-testid="labor-rate-input"]', '75')
    await page.click('[data-testid="save-labor-button"]')

    await expect(page.locator('[data-testid="labor-list"]')).toContainText('Electrical Work')
  })

  // Regional Pricing Tests (2 tests)
  test('should apply regional pricing adjustment', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="pricing-tab"]')
    await page.selectOption('[data-testid="region-select"]', 'california')

    const beforeCost = await page.locator('[data-testid="total-cost"]').textContent()
    await page.click('[data-testid="apply-regional-pricing-button"]')
    const afterCost = await page.locator('[data-testid="total-cost"]').textContent()

    expect(beforeCost).not.toBe(afterCost)
    await expect(page.locator('[data-testid="regional-multiplier"]')).toContainText(/1\.\d+/)
  })

  test('should include tax and permits', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="pricing-tab"]')
    await page.check('[data-testid="include-sales-tax-checkbox"]')
    await page.check('[data-testid="include-permits-checkbox"]')

    await expect(page.locator('[data-testid="sales-tax-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="permit-fees-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="grand-total"]')).toContainText(/\$[\d,]+/)
  })

  // Export Report Tests (3 tests)
  test('should export as PDF', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="export-pdf-option"]')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-pdf-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/cost-estimate.*\.pdf/)
  })

  test('should export as Excel spreadsheet', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="export-excel-option"]')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-excel-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/cost-estimate.*\.xlsx/)
  })

  test('should generate schedule of values', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/cost-estimation`)

    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="schedule-of-values-option"]')

    await page.fill('[data-testid="project-name-input"]', 'Residential Construction')
    await page.fill('[data-testid="owner-name-input"]', 'John Doe')
    await page.selectOption('[data-testid="payment-schedule-select"]', 'monthly')

    await page.click('[data-testid="generate-sov-button"]')

    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/schedule-of-values.*\.pdf/)
  })
})

/**
 * Test Summary:
 * - Material Selection: 3 tests (takeoff, custom materials, edit quantities)
 * - Labor Calculation: 2 tests (calculate labor, custom items)
 * - Regional Pricing: 2 tests (regional adjustment, tax and permits)
 * - Export Report: 3 tests (PDF, Excel, schedule of values)
 *
 * Total: 10 comprehensive E2E tests covering cost estimation workflow
 */
