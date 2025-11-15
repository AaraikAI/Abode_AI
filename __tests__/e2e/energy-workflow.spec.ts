/**
 * Energy Simulation Workflow E2E Tests
 * Complete end-to-end workflow testing for energy simulation features
 * Total: 10 tests
 *
 * Workflow: Building input → HVAC sizing → Solar analysis → Generate report
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('Energy Simulation Workflow E2E Tests', () => {
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

  // Building Input Tests (3 tests)
  test('should input building envelope data', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.fill('[data-testid="building-area-input"]', '2500')
    await page.fill('[data-testid="wall-r-value-input"]', '19')
    await page.fill('[data-testid="roof-r-value-input"]', '38')
    await page.fill('[data-testid="window-u-value-input"]', '0.3')
    await page.selectOption('[data-testid="climate-zone-select"]', 'zone-4')

    await page.click('[data-testid="save-envelope-button"]')
    await expect(page.locator('[data-testid="envelope-saved-toast"]')).toBeVisible()
  })

  test('should configure occupancy and schedule', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="occupancy-tab"]')
    await page.fill('[data-testid="occupants-input"]', '4')
    await page.selectOption('[data-testid="occupancy-type-select"]', 'residential')
    await page.fill('[data-testid="internal-gains-input"]', '500')

    await page.click('[data-testid="save-occupancy-button"]')
    await expect(page.locator('[data-testid="occupancy-saved-toast"]')).toBeVisible()
  })

  test('should set lighting and equipment loads', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="loads-tab"]')
    await page.fill('[data-testid="lighting-watts-sqft-input"]', '1.2')
    await page.fill('[data-testid="equipment-watts-sqft-input"]', '0.8')
    await page.selectOption('[data-testid="lighting-type-select"]', 'led')

    await page.click('[data-testid="calculate-loads-button"]')
    await expect(page.locator('[data-testid="total-lighting-load"]')).toContainText(/\d+ W/)
  })

  // HVAC Sizing Tests (2 tests)
  test('should perform HVAC load calculation', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="hvac-tab"]')
    await page.click('[data-testid="calculate-hvac-button"]')

    await expect(page.locator('[data-testid="heating-load"]')).toContainText(/\d+ BTU\/h/, { timeout: 10000 })
    await expect(page.locator('[data-testid="cooling-load"]')).toContainText(/\d+ BTU\/h/)
    await expect(page.locator('[data-testid="recommended-hvac-size"]')).toBeVisible()
  })

  test('should select HVAC system and efficiency', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="hvac-tab"]')
    await page.selectOption('[data-testid="hvac-type-select"]', 'heat-pump')
    await page.fill('[data-testid="seer-rating-input"]', '18')
    await page.fill('[data-testid="hspf-rating-input"]', '10')

    await page.click('[data-testid="update-hvac-button"]')
    await expect(page.locator('[data-testid="annual-energy-cost"]')).toContainText(/\$[\d,]+/)
  })

  // Solar Analysis Tests (3 tests)
  test('should analyze solar potential', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="solar-tab"]')
    await page.click('[data-testid="analyze-solar-button"]')

    await expect(page.locator('[data-testid="solar-irradiance"]')).toContainText(/\d+ kWh/, { timeout: 10000 })
    await expect(page.locator('[data-testid="suitable-roof-area"]')).toContainText(/\d+ sqft/)
    await expect(page.locator('[data-testid="solar-potential-map"]')).toBeVisible()
  })

  test('should design solar PV system', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="solar-tab"]')
    await page.fill('[data-testid="panel-count-input"]', '20')
    await page.fill('[data-testid="panel-wattage-input"]', '400')
    await page.selectOption('[data-testid="inverter-type-select"]', 'string')

    await page.click('[data-testid="calculate-solar-button"]')
    await expect(page.locator('[data-testid="system-capacity"]')).toContainText('8.0 kW')
    await expect(page.locator('[data-testid="annual-production"]')).toContainText(/\d+ kWh/)
  })

  test('should calculate solar ROI', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="solar-tab"]')
    await page.fill('[data-testid="system-cost-input"]', '16000')
    await page.fill('[data-testid="electricity-rate-input"]', '0.13')
    await page.check('[data-testid="include-incentives-checkbox"]')

    await page.click('[data-testid="calculate-roi-button"]')
    await expect(page.locator('[data-testid="payback-period"]')).toContainText(/\d+ years/)
    await expect(page.locator('[data-testid="lifetime-savings"]')).toContainText(/\$[\d,]+/)
  })

  // Report Generation Tests (2 tests)
  test('should generate energy performance report', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="reports-tab"]')
    await page.click('[data-testid="generate-report-button"]')

    await expect(page.locator('[data-testid="eui-value"]')).toContainText(/\d+ kBtu\/sqft/)
    await expect(page.locator('[data-testid="carbon-footprint"]')).toContainText(/\d+ tons CO2/)
    await expect(page.locator('[data-testid="energy-star-score"]')).toBeVisible()
  })

  test('should export compliance documentation', async () => {
    await page.goto(`${BASE_URL}/projects/test-project/energy-simulation`)

    await page.click('[data-testid="reports-tab"]')
    await page.click('[data-testid="export-compliance-button"]')
    await page.selectOption('[data-testid="code-version-select"]', 'iecc-2021')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-compliance-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/energy-compliance.*\.pdf/)
  })
})

/**
 * Test Summary:
 * - Building Input: 3 tests (envelope, occupancy, loads)
 * - HVAC Sizing: 2 tests (load calculation, system selection)
 * - Solar Analysis: 3 tests (potential, PV design, ROI)
 * - Report Generation: 2 tests (performance report, compliance)
 *
 * Total: 10 comprehensive E2E tests covering energy simulation workflow
 */
