/**
 * Rendering Workflow E2E Tests
 * Complete end-to-end workflow testing for rendering features
 * Total: 15 tests
 *
 * Workflow: Configure settings → Queue render → Monitor progress → Download results
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456!'
}

test.describe('Rendering Workflow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Sign in before each test
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', TEST_USER.email)
    await page.fill('[data-testid="password-input"]', TEST_USER.password)
    await page.click('[data-testid="signin-button"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test.afterEach(async () => {
    await page.close()
  })

  // Complete Rendering Workflow (3 tests)
  test('should complete full rendering workflow', async () => {
    // Navigate to project
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')

    // Open rendering settings
    await page.click('[data-testid="render-button"]')
    await expect(page.locator('[data-testid="render-settings-modal"]')).toBeVisible()

    // Configure render settings
    await page.selectOption('[data-testid="quality-select"]', 'high')
    await page.selectOption('[data-testid="resolution-select"]', '1920x1080')
    await page.click('[data-testid="enable-raytracing"]')

    // Queue render job
    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()

    // Navigate to render queue
    await page.click('[data-testid="view-queue-button"]')
    await expect(page).toHaveURL(/\/renders/)

    // Monitor progress
    const jobCard = page.locator('[data-testid="render-job-card"]:first-child')
    await expect(jobCard.locator('[data-testid="job-status"]')).toContainText(/queued|processing/)

    // Wait for completion (mock completion for test)
    await jobCard.click()
    await expect(page.locator('[data-testid="render-preview"]')).toBeVisible({ timeout: 10000 })

    // Download result
    await page.click('[data-testid="download-render-button"]')
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/render.*\.(png|jpg)/)
  })

  test('should handle multiple render jobs', async () => {
    await page.goto(`${BASE_URL}/dashboard`)

    // Queue 3 render jobs
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="projects-nav"]')
      await page.click('[data-testid="project-card"]:first-child')
      await page.click('[data-testid="render-button"]')
      await page.selectOption('[data-testid="quality-select"]', i === 0 ? 'low' : i === 1 ? 'medium' : 'high')
      await page.click('[data-testid="queue-render-button"]')
      await page.waitForTimeout(1000)
    }

    // Verify all jobs in queue
    await page.goto(`${BASE_URL}/renders`)
    const jobCards = page.locator('[data-testid="render-job-card"]')
    await expect(jobCards).toHaveCount(3, { timeout: 5000 })
  })

  test('should cancel queued render job', async () => {
    // Queue a render
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')
    await page.click('[data-testid="queue-render-button"]')

    // Navigate to queue
    await page.goto(`${BASE_URL}/renders`)

    // Cancel job
    await page.click('[data-testid="render-job-card"]:first-child [data-testid="cancel-button"]')
    await page.click('[data-testid="confirm-cancel-button"]')

    // Verify cancellation
    await expect(page.locator('[data-testid="render-job-card"]:first-child [data-testid="job-status"]'))
      .toContainText('cancelled')
  })

  // Quality Settings Tests (3 tests)
  test('should render with low quality settings', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.selectOption('[data-testid="quality-select"]', 'low')
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText(/\d+ seconds/)

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  test('should render with high quality settings', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.selectOption('[data-testid="quality-select"]', 'high')
    await page.click('[data-testid="enable-raytracing"]')
    await page.click('[data-testid="enable-global-illumination"]')
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText(/\d+ minutes/)

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  test('should configure custom resolution', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.selectOption('[data-testid="resolution-select"]', 'custom')
    await page.fill('[data-testid="width-input"]', '3840')
    await page.fill('[data-testid="height-input"]', '2160')

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  // Post-FX Settings Tests (3 tests)
  test('should apply post-processing effects', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="post-fx-tab"]')
    await page.click('[data-testid="enable-bloom"]')
    await page.fill('[data-testid="bloom-intensity"]', '0.8')
    await page.click('[data-testid="enable-dof"]')
    await page.fill('[data-testid="dof-aperture"]', '2.8')

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  test('should apply color grading', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="post-fx-tab"]')
    await page.selectOption('[data-testid="tonemapping-select"]', 'filmic')
    await page.fill('[data-testid="exposure"]', '1.2')
    await page.fill('[data-testid="saturation"]', '1.1')

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  test('should upload and apply custom LUT', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="post-fx-tab"]')

    // Upload LUT file
    const fileInput = page.locator('[data-testid="lut-upload-input"]')
    await fileInput.setInputFiles({
      name: 'custom-lut.cube',
      mimeType: 'text/plain',
      buffer: Buffer.from('LUT test data')
    })

    await expect(page.locator('[data-testid="lut-preview"]')).toBeVisible()

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  // Walkthrough Animation Tests (2 tests)
  test('should create walkthrough animation', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="animation-tab"]')
    await page.click('[data-testid="enable-walkthrough"]')

    // Set keyframes
    await page.click('[data-testid="add-keyframe-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="add-keyframe-button"]')

    await page.fill('[data-testid="animation-duration"]', '30')
    await page.selectOption('[data-testid="fps-select"]', '30')

    await page.click('[data-testid="queue-render-button"]')
    await expect(page.locator('[data-testid="render-queued-toast"]')).toBeVisible()
  })

  test('should preview walkthrough path', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="animation-tab"]')
    await page.click('[data-testid="enable-walkthrough"]')
    await page.click('[data-testid="add-keyframe-button"]')
    await page.click('[data-testid="add-keyframe-button"]')

    // Preview animation
    await page.click('[data-testid="preview-animation-button"]')
    await expect(page.locator('[data-testid="animation-preview-player"]')).toBeVisible()

    // Play preview
    await page.click('[data-testid="play-preview-button"]')
    await page.waitForTimeout(2000)
    await page.click('[data-testid="pause-preview-button"]')
  })

  // Batch Rendering Tests (2 tests)
  test('should create batch render with multiple views', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="batch-tab"]')
    await page.click('[data-testid="add-view-button"]')
    await page.click('[data-testid="add-view-button"]')
    await page.click('[data-testid="add-view-button"]')

    const viewCards = page.locator('[data-testid="batch-view-card"]')
    await expect(viewCards).toHaveCount(3)

    await page.click('[data-testid="queue-batch-render-button"]')
    await expect(page.locator('[data-testid="batch-queued-toast"]')).toBeVisible()
  })

  test('should configure different settings per batch view', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="render-button"]')

    await page.click('[data-testid="batch-tab"]')

    // View 1: Interior shot
    await page.click('[data-testid="add-view-button"]')
    await page.fill('[data-testid="batch-view-card"]:first-child [data-testid="view-name"]', 'Interior')
    await page.selectOption('[data-testid="batch-view-card"]:first-child [data-testid="view-quality"]', 'high')

    // View 2: Exterior shot
    await page.click('[data-testid="add-view-button"]')
    await page.fill('[data-testid="batch-view-card"]:nth-child(2) [data-testid="view-name"]', 'Exterior')
    await page.selectOption('[data-testid="batch-view-card"]:nth-child(2) [data-testid="view-quality"]', 'medium')

    await page.click('[data-testid="queue-batch-render-button"]')
    await expect(page.locator('[data-testid="batch-queued-toast"]')).toBeVisible()
  })

  // Export & Download Tests (2 tests)
  test('should download completed render in multiple formats', async () => {
    await page.goto(`${BASE_URL}/renders`)

    // Click on completed render
    await page.click('[data-testid="render-job-card"][data-status="completed"]:first-child')

    // Download as PNG
    await page.click('[data-testid="download-format-select"]')
    await page.click('[data-testid="format-png"]')
    const pngDownload = page.waitForEvent('download')
    await page.click('[data-testid="download-button"]')
    expect((await pngDownload).suggestedFilename()).toMatch(/\.png$/)

    // Download as JPEG
    await page.click('[data-testid="download-format-select"]')
    await page.click('[data-testid="format-jpeg"]')
    const jpegDownload = page.waitForEvent('download')
    await page.click('[data-testid="download-button"]')
    expect((await jpegDownload).suggestedFilename()).toMatch(/\.jpg$/)
  })

  test('should share render via link', async () => {
    await page.goto(`${BASE_URL}/renders`)

    // Click on completed render
    await page.click('[data-testid="render-job-card"][data-status="completed"]:first-child')

    // Generate share link
    await page.click('[data-testid="share-render-button"]')
    await page.click('[data-testid="generate-link-button"]')

    // Copy link
    await expect(page.locator('[data-testid="share-link-input"]')).toBeVisible()
    const shareLink = await page.locator('[data-testid="share-link-input"]').inputValue()
    expect(shareLink).toMatch(/^https?:\/\//)

    await page.click('[data-testid="copy-link-button"]')
    await expect(page.locator('[data-testid="link-copied-toast"]')).toBeVisible()
  })
})

/**
 * Test Summary:
 * - Complete Workflow: 3 tests (full workflow, multiple jobs, cancellation)
 * - Quality Settings: 3 tests (low quality, high quality, custom resolution)
 * - Post-FX: 3 tests (post-processing effects, color grading, custom LUT)
 * - Walkthrough Animation: 2 tests (create animation, preview path)
 * - Batch Rendering: 2 tests (multiple views, different settings per view)
 * - Export & Download: 2 tests (multiple formats, share link)
 *
 * Total: 15 comprehensive E2E tests covering complete rendering workflow
 */
