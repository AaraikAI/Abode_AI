/**
 * Blockchain Workflow E2E Tests
 * Complete end-to-end workflow testing for blockchain features
 * Total: 10 tests
 *
 * Workflow: Material register → Supply chain tracking → Verification → NFT minting
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('Blockchain Workflow E2E Tests', () => {
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

  // Material Registration Tests (3 tests)
  test('should register material on blockchain', async () => {
    await page.goto(`${BASE_URL}/blockchain/materials`)

    await page.click('[data-testid="register-material-button"]')
    await page.fill('[data-testid="material-name-input"]', 'Sustainable Concrete Mix')
    await page.fill('[data-testid="material-code-input"]', 'CONC-001')
    await page.fill('[data-testid="manufacturer-input"]', 'Green Building Materials Inc')
    await page.fill('[data-testid="carbon-footprint-input"]', '120')
    await page.fill('[data-testid="recycled-content-input"]', '30')

    await page.click('[data-testid="submit-registration-button"]')
    await expect(page.locator('[data-testid="blockchain-pending-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="transaction-hash"]')).toBeVisible({ timeout: 15000 })
  })

  test('should view material registry', async () => {
    await page.goto(`${BASE_URL}/blockchain/materials`)

    await expect(page.locator('[data-testid="material-list"]')).toBeVisible()
    const materials = page.locator('[data-testid="material-card"]')
    await expect(materials).toHaveCount(3, { timeout: 5000 })

    // Click on material
    await materials.first().click()
    await expect(page.locator('[data-testid="material-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="blockchain-address"]')).toMatch(/0x[a-fA-F0-9]{40}/)
  })

  test('should update material certification', async () => {
    await page.goto(`${BASE_URL}/blockchain/materials/CONC-001`)

    await page.click('[data-testid="add-certification-button"]')
    await page.selectOption('[data-testid="cert-type-select"]', 'leed')
    await page.fill('[data-testid="cert-number-input"]', 'LEED-12345')
    await page.fill('[data-testid="cert-date-input"]', '2024-01-15')

    const fileInput = page.locator('[data-testid="cert-document-input"]')
    await fileInput.setInputFiles({
      name: 'certification.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF certificate content')
    })

    await page.click('[data-testid="save-certification-button"]')
    await expect(page.locator('[data-testid="certification-added-toast"]')).toBeVisible()
  })

  // Supply Chain Tracking Tests (3 tests)
  test('should track material from source to site', async () => {
    await page.goto(`${BASE_URL}/blockchain/supply-chain`)

    await page.click('[data-testid="track-shipment-button"]')
    await page.fill('[data-testid="shipment-id-input"]', 'SHIP-2024-001')
    await page.selectOption('[data-testid="material-select"]', 'CONC-001')
    await page.fill('[data-testid="quantity-input"]', '50')
    await page.fill('[data-testid="origin-input"]', 'Factory A, City X')
    await page.fill('[data-testid="destination-input"]', 'Construction Site B, City Y')

    await page.click('[data-testid="start-tracking-button"]')
    await expect(page.locator('[data-testid="tracking-initiated-toast"]')).toBeVisible()
  })

  test('should update shipment status', async () => {
    await page.goto(`${BASE_URL}/blockchain/supply-chain/SHIP-2024-001`)

    await expect(page.locator('[data-testid="shipment-timeline"]')).toBeVisible()

    // Add status update
    await page.click('[data-testid="add-checkpoint-button"]')
    await page.selectOption('[data-testid="status-select"]', 'in-transit')
    await page.fill('[data-testid="location-input"]', 'Distribution Center, City Z')
    await page.fill('[data-testid="notes-input"]', 'Quality inspection passed')

    await page.click('[data-testid="save-checkpoint-button"]')
    await expect(page.locator('[data-testid="checkpoint-added-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="timeline-item"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('should verify supply chain integrity', async () => {
    await page.goto(`${BASE_URL}/blockchain/supply-chain/SHIP-2024-001`)

    await page.click('[data-testid="verify-chain-button"]')

    await expect(page.locator('[data-testid="verification-result"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="integrity-status"]')).toContainText(/Verified|Valid/)
    await expect(page.locator('[data-testid="blockchain-confirmations"]')).toContainText(/\d+ confirmations/)
  })

  // Provenance Verification Tests (2 tests)
  test('should verify material provenance', async () => {
    await page.goto(`${BASE_URL}/blockchain/materials/CONC-001`)

    await page.click('[data-testid="verify-provenance-button"]')

    await expect(page.locator('[data-testid="provenance-chain"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="origin-verified-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="certification-verified-badge"]')).toBeVisible()
  })

  test('should generate verification certificate', async () => {
    await page.goto(`${BASE_URL}/blockchain/materials/CONC-001`)

    await page.click('[data-testid="generate-certificate-button"]')
    await page.fill('[data-testid="recipient-name-input"]', 'Building Inspector')
    await page.fill('[data-testid="recipient-email-input"]', 'inspector@example.com')

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="create-certificate-button"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/provenance-certificate.*\.pdf/)
  })

  // NFT Minting Tests (2 tests)
  test('should mint design as NFT', async () => {
    await page.goto(`${BASE_URL}/projects/test-project`)

    await page.click('[data-testid="blockchain-button"]')
    await page.click('[data-testid="mint-nft-button"]')

    await page.fill('[data-testid="nft-name-input"]', 'Modern Villa Design')
    await page.fill('[data-testid="nft-description-input"]', 'Unique architectural design with sustainable features')
    await page.fill('[data-testid="royalty-percentage-input"]', '10')

    // Select preview image
    const fileInput = page.locator('[data-testid="nft-image-input"]')
    await fileInput.setInputFiles({
      name: 'design-preview.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('JPEG image data')
    })

    await page.click('[data-testid="mint-nft-submit-button"]')
    await expect(page.locator('[data-testid="minting-in-progress-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="nft-minted-toast"]')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-testid="nft-token-id"]')).toBeVisible()
  })

  test('should view and transfer NFT', async () => {
    await page.goto(`${BASE_URL}/blockchain/nfts`)

    const nftCard = page.locator('[data-testid="nft-card"]:first-child')
    await nftCard.click()

    await expect(page.locator('[data-testid="nft-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="nft-owner"]')).toContainText(TEST_USER.email)

    // Transfer NFT
    await page.click('[data-testid="transfer-nft-button"]')
    await page.fill('[data-testid="recipient-address-input"]', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
    await page.click('[data-testid="confirm-transfer-button"]')

    await expect(page.locator('[data-testid="transfer-initiated-toast"]')).toBeVisible()
  })
})

/**
 * Test Summary:
 * - Material Registration: 3 tests (register, view registry, update certification)
 * - Supply Chain Tracking: 3 tests (track shipment, update status, verify integrity)
 * - Provenance Verification: 2 tests (verify provenance, generate certificate)
 * - NFT Minting: 2 tests (mint design NFT, view and transfer)
 *
 * Total: 10 comprehensive E2E tests covering blockchain workflow
 */
