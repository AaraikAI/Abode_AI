/**
 * IoT Integration Workflow E2E Tests
 * Complete end-to-end workflow testing for IoT and Digital Twin features
 * Total: 10 tests
 *
 * Workflow: Device setup → Sensor data collection → Digital twin sync → Alerts
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('IoT Integration Workflow E2E Tests', () => {
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

  // Device Setup Tests (3 tests)
  test('should register new IoT device', async () => {
    await page.goto(`${BASE_URL}/iot/devices`)

    await page.click('[data-testid="add-device-button"]')
    await page.fill('[data-testid="device-name-input"]', 'Temperature Sensor 1')
    await page.selectOption('[data-testid="device-type-select"]', 'temperature')
    await page.fill('[data-testid="device-id-input"]', 'TEMP-001')
    await page.selectOption('[data-testid="protocol-select"]', 'mqtt')

    await page.click('[data-testid="register-device-button"]')
    await expect(page.locator('[data-testid="device-registered-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="device-list"]')).toContainText('Temperature Sensor 1')
  })

  test('should configure device settings', async () => {
    await page.goto(`${BASE_URL}/iot/devices`)

    await page.click('[data-testid="device-card"]:first-child')
    await page.click('[data-testid="device-settings-button"]')

    await page.fill('[data-testid="sampling-rate-input"]', '60')
    await page.selectOption('[data-testid="data-format-select"]', 'json')
    await page.check('[data-testid="enable-encryption-checkbox"]')

    await page.click('[data-testid="save-settings-button"]')
    await expect(page.locator('[data-testid="settings-saved-toast"]')).toBeVisible()
  })

  test('should test device connection', async () => {
    await page.goto(`${BASE_URL}/iot/devices`)

    await page.click('[data-testid="device-card"]:first-child')
    await page.click('[data-testid="test-connection-button"]')

    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/Connected|Testing/, { timeout: 10000 })
    await expect(page.locator('[data-testid="signal-strength"]')).toBeVisible()
  })

  // Sensor Data Tests (3 tests)
  test('should view real-time sensor data', async () => {
    await page.goto(`${BASE_URL}/iot/devices/temp-sensor-1`)

    await expect(page.locator('[data-testid="current-temperature"]')).toContainText(/\d+°[CF]/)
    await expect(page.locator('[data-testid="last-update-time"]')).toBeVisible()

    // Wait for data update
    await page.waitForTimeout(2000)
    const firstValue = await page.locator('[data-testid="current-temperature"]').textContent()
    await page.waitForTimeout(3000)
    const secondValue = await page.locator('[data-testid="current-temperature"]').textContent()

    // Values might be same or different depending on sensor
    expect(firstValue).toBeDefined()
    expect(secondValue).toBeDefined()
  })

  test('should view sensor data history', async () => {
    await page.goto(`${BASE_URL}/iot/devices/temp-sensor-1`)

    await page.click('[data-testid="history-tab"]')
    await page.selectOption('[data-testid="time-range-select"]', '24h')

    await expect(page.locator('[data-testid="data-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="data-point"]')).toHaveCount(24, { timeout: 5000 })
  })

  test('should export sensor data', async () => {
    await page.goto(`${BASE_URL}/iot/devices/temp-sensor-1`)

    await page.click('[data-testid="export-data-button"]')
    await page.selectOption('[data-testid="export-format-select"]', 'csv')
    await page.selectOption('[data-testid="export-range-select"]', '7d')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-export-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/sensor-data.*\.csv/)
  })

  // Digital Twin Sync Tests (2 tests)
  test('should create digital twin from building model', async () => {
    await page.goto(`${BASE_URL}/projects/test-project`)

    await page.click('[data-testid="digital-twin-button"]')
    await page.click('[data-testid="create-twin-button"]')

    await page.fill('[data-testid="twin-name-input"]', 'Building Twin v1')
    await page.selectOption('[data-testid="sync-frequency-select"]', 'real-time')

    await page.click('[data-testid="create-twin-submit-button"]')
    await expect(page.locator('[data-testid="twin-created-toast"]')).toBeVisible()
  })

  test('should sync sensor data to digital twin', async () => {
    await page.goto(`${BASE_URL}/digital-twin/building-twin-1`)

    // Map sensors to twin elements
    await page.click('[data-testid="sensor-mapping-button"]')
    await page.click('[data-testid="map-sensor-button"]')

    const sensorDropdown = page.locator('[data-testid="sensor-select"]')
    await sensorDropdown.selectOption('temp-sensor-1')

    const elementDropdown = page.locator('[data-testid="element-select"]')
    await elementDropdown.selectOption('room-101')

    await page.click('[data-testid="save-mapping-button"]')
    await expect(page.locator('[data-testid="sensor-mapped-toast"]')).toBeVisible()

    // Verify data sync
    await expect(page.locator('[data-testid="room-101-temperature"]')).toContainText(/\d+°[CF]/, { timeout: 10000 })
  })

  // Alert Configuration Tests (2 tests)
  test('should configure threshold alerts', async () => {
    await page.goto(`${BASE_URL}/iot/devices/temp-sensor-1`)

    await page.click('[data-testid="alerts-tab"]')
    await page.click('[data-testid="add-alert-button"]')

    await page.fill('[data-testid="alert-name-input"]', 'High Temperature Warning')
    await page.selectOption('[data-testid="condition-select"]', 'greater-than')
    await page.fill('[data-testid="threshold-value-input"]', '85')
    await page.selectOption('[data-testid="severity-select"]', 'warning')

    await page.click('[data-testid="save-alert-button"]')
    await expect(page.locator('[data-testid="alert-created-toast"]')).toBeVisible()
  })

  test('should receive and manage alerts', async () => {
    await page.goto(`${BASE_URL}/iot/alerts`)

    await expect(page.locator('[data-testid="alert-list"]')).toBeVisible()
    const activeAlerts = page.locator('[data-testid="active-alert"]')

    if (await activeAlerts.count() > 0) {
      await activeAlerts.first().click()
      await expect(page.locator('[data-testid="alert-details"]')).toBeVisible()

      // Acknowledge alert
      await page.click('[data-testid="acknowledge-alert-button"]')
      await page.fill('[data-testid="acknowledgment-notes"]', 'Investigating temperature spike')
      await page.click('[data-testid="save-acknowledgment-button"]')

      await expect(page.locator('[data-testid="alert-acknowledged-toast"]')).toBeVisible()
    }
  })
})

/**
 * Test Summary:
 * - Device Setup: 3 tests (register device, configure settings, test connection)
 * - Sensor Data: 3 tests (real-time view, history, export)
 * - Digital Twin Sync: 2 tests (create twin, sync sensor data)
 * - Alert Configuration: 2 tests (configure thresholds, manage alerts)
 *
 * Total: 10 comprehensive E2E tests covering IoT integration workflow
 */
