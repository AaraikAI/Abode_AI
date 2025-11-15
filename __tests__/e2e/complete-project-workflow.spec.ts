/**
 * Complete Project Workflow E2E Tests (15 tests)
 * End-to-end testing of complete project lifecycle from creation to export
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Complete Project Workflow', () => {
  let page: Page
  let projectId: string

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto(BASE_URL)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Complete workflow: Create → Model → Render → Export', async () => {
    // 1. Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // 2. Create new project
    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'E2E Test Project')
    await page.fill('[data-testid="project-description"]', 'Created by automated test')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    // Extract project ID from URL
    const url = page.url()
    projectId = url.split('/').pop()!
    expect(projectId).toBeTruthy()

    // 3. Navigate to Studio
    await page.click('[data-testid="open-studio-button"]')
    await page.waitForSelector('[data-testid="3d-canvas"]')

    // 4. Add floor
    await page.click('[data-testid="add-model-button"]')
    await page.fill('[data-testid="search-models"]', 'floor')
    await page.click('[data-testid="model-result"]:first-child')
    await page.waitForSelector('[data-testid="scene-object"]')

    // 5. Add furniture (chair)
    await page.click('[data-testid="add-model-button"]')
    await page.fill('[data-testid="search-models"]', 'chair')
    await page.click('[data-testid="model-result"]:first-child')
    await page.waitForTimeout(1000)

    // 6. Transform chair position
    await page.click('[data-testid="scene-object"]:nth-child(2)')
    await page.click('[data-testid="transform-move"]')
    const canvas = await page.locator('[data-testid="3d-canvas"]')
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2)
      await page.mouse.up()
    }

    // 7. Apply material
    await page.click('[data-testid="materials-tab"]')
    await page.click('[data-testid="material-wood"]')
    await page.click('[data-testid="apply-material-button"]')
    await page.waitForTimeout(500)

    // 8. Adjust lighting
    await page.click('[data-testid="lighting-tab"]')
    await page.click('[data-testid="add-point-light"]')
    await page.fill('[data-testid="light-intensity"]', '800')
    await page.click('[data-testid="apply-lighting"]')

    // 9. Save project
    await page.click('[data-testid="save-project-button"]')
    await page.waitForSelector('[data-testid="save-success-message"]')
    const saveMessage = await page.locator('[data-testid="save-success-message"]').textContent()
    expect(saveMessage).toContain('saved')

    // 10. Queue render
    await page.click('[data-testid="render-button"]')
    await page.fill('[data-testid="render-quality"]', 'high')
    await page.fill('[data-testid="render-resolution"]', '1920x1080')
    await page.click('[data-testid="start-render-button"]')
    await page.waitForSelector('[data-testid="render-queued"]')

    // 11. Check render status
    await page.goto(`${BASE_URL}/renders`)
    await page.waitForSelector('[data-testid="render-job"]')
    const renderStatus = await page.locator('[data-testid="render-status"]').textContent()
    expect(['pending', 'processing']).toContain(renderStatus)

    // 12. Export scene (GLTF)
    await page.goto(`${BASE_URL}/projects/${projectId}/studio`)
    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="export-gltf"]')
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="confirm-export"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.gltf$/)

    // 13. Share project
    await page.click('[data-testid="share-button"]')
    await page.fill('[data-testid="share-email"]', 'colleague@example.com')
    await page.select('[data-testid="permission-level"]', 'view')
    await page.click('[data-testid="send-invitation"]')
    await page.waitForSelector('[data-testid="invitation-sent"]')

    // 14. Create version
    await page.click('[data-testid="versions-tab"]')
    await page.click('[data-testid="create-version-button"]')
    await page.fill('[data-testid="version-name"]', 'v1.0')
    await page.fill('[data-testid="version-notes"]', 'Initial version')
    await page.click('[data-testid="save-version"]')
    await page.waitForSelector('[data-testid="version-created"]')

    // 15. Verify project in dashboard
    await page.goto(`${BASE_URL}/dashboard`)
    const projectCard = await page.locator(`[data-testid="project-${projectId}"]`)
    expect(await projectCard.isVisible()).toBe(true)
    const projectName = await projectCard.locator('[data-testid="project-name"]').textContent()
    expect(projectName).toBe('E2E Test Project')
  })

  test('File upload and parsing workflow', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Create project
    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'Upload Test')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    // Upload floor plan
    await page.click('[data-testid="upload-file-button"]')
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-fixtures/floor-plan.pdf')
    await page.waitForSelector('[data-testid="file-uploaded"]')

    // Parse floor plan
    await page.click('[data-testid="parse-file-button"]')
    await page.waitForSelector('[data-testid="parsing-complete"]', { timeout: 30000 })

    // Verify GeoJSON output
    const geojsonExists = await page.locator('[data-testid="geojson-output"]').isVisible()
    expect(geojsonExists).toBe(true)

    // View parsed elements
    await page.click('[data-testid="view-parsed-elements"]')
    const elementCount = await page.locator('[data-testid="element-item"]').count()
    expect(elementCount).toBeGreaterThan(0)
  })

  test('IFC import and BIM workflow', async () => {
    // Sign in and create project
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'BIM Project')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    // Navigate to BIM section
    await page.click('[data-testid="bim-tab"]')

    // Import IFC file
    await page.click('[data-testid="import-ifc-button"]')
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-fixtures/sample.ifc')
    await page.waitForSelector('[data-testid="ifc-imported"]', { timeout: 30000 })

    // Verify element tree
    await page.waitForSelector('[data-testid="element-tree"]')
    const treeItems = await page.locator('[data-testid="tree-item"]').count()
    expect(treeItems).toBeGreaterThan(0)

    // Select element and view properties
    await page.click('[data-testid="tree-item"]:first-child')
    await page.waitForSelector('[data-testid="property-panel"]')
    const properties = await page.locator('[data-testid="property-row"]').count()
    expect(properties).toBeGreaterThan(0)

    // Run clash detection
    await page.click('[data-testid="clash-detection-button"]')
    await page.waitForSelector('[data-testid="clash-detection-complete"]')
    const clashResults = await page.locator('[data-testid="clash-result"]').count()
    expect(clashResults).toBeGreaterThanOrEqual(0)

    // Export quantity takeoff
    await page.click('[data-testid="quantity-takeoff-button"]')
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-quantities"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/quantities\.(csv|xlsx)$/)
  })

  test('Collaborative editing workflow', async () => {
    // User 1: Create and share project
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'user1@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'Collaboration Test')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    const url = page.url()
    projectId = url.split('/').pop()!

    // Share with user 2
    await page.click('[data-testid="share-button"]')
    await page.fill('[data-testid="share-email"]', 'user2@example.com')
    await page.select('[data-testid="permission-level"]', 'edit')
    await page.click('[data-testid="send-invitation"]')
    await page.waitForSelector('[data-testid="invitation-sent"]')

    // Add a comment
    await page.click('[data-testid="comments-button"]')
    await page.fill('[data-testid="comment-input"]', 'Please review the floor layout')
    await page.click('[data-testid="post-comment"]')
    await page.waitForSelector('[data-testid="comment-posted"]')

    // Verify active users indicator
    await page.click('[data-testid="open-studio-button"]')
    const activeUsers = await page.locator('[data-testid="active-users"]')
    expect(await activeUsers.isVisible()).toBe(true)
  })

  test('Cost estimation workflow', async () => {
    // Sign in and navigate to project
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Open existing project with models
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="cost-estimation-tab"]')

    // Generate material takeoff
    await page.click('[data-testid="generate-takeoff-button"]')
    await page.waitForSelector('[data-testid="takeoff-complete"]')

    // Verify material list
    const materials = await page.locator('[data-testid="material-item"]').count()
    expect(materials).toBeGreaterThan(0)

    // Add labor costs
    await page.click('[data-testid="labor-tab"]')
    await page.click('[data-testid="add-labor-item"]')
    await page.fill('[data-testid="labor-description"]', 'Installation')
    await page.fill('[data-testid="labor-hours"]', '40')
    await page.fill('[data-testid="labor-rate"]', '75')
    await page.click('[data-testid="save-labor"]')

    // View estimate summary
    await page.click('[data-testid="summary-tab"]')
    const totalCost = await page.locator('[data-testid="total-cost"]').textContent()
    expect(totalCost).toMatch(/\$[\d,]+/)

    // Export estimate
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-estimate-button"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/estimate\.pdf$/)
  })

  test('Energy simulation workflow', async () => {
    // Sign in and navigate to project
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="energy-tab"]')

    // Configure simulation
    await page.click('[data-testid="new-simulation-button"]')
    await page.fill('[data-testid="building-area"]', '2000')
    await page.select('[data-testid="climate-zone"]', 'Mixed-Humid')
    await page.fill('[data-testid="occupancy"]', '50')

    // Add HVAC system
    await page.click('[data-testid="hvac-tab"]')
    await page.select('[data-testid="hvac-type"]', 'Heat Pump')
    await page.fill('[data-testid="hvac-efficiency"]', '16')

    // Run simulation
    await page.click('[data-testid="run-simulation-button"]')
    await page.waitForSelector('[data-testid="simulation-complete"]', { timeout: 60000 })

    // View results
    const energyUse = await page.locator('[data-testid="annual-energy-use"]').textContent()
    expect(energyUse).toMatch(/\d+\s*kWh/)

    const carbonFootprint = await page.locator('[data-testid="carbon-footprint"]').textContent()
    expect(carbonFootprint).toMatch(/\d+\s*kg CO2/)

    // View recommendations
    await page.click('[data-testid="recommendations-tab"]')
    const recommendations = await page.locator('[data-testid="recommendation-item"]').count()
    expect(recommendations).toBeGreaterThan(0)
  })

  test('Payment and subscription workflow', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Navigate to settings
    await page.click('[data-testid="settings-button"]')
    await page.click('[data-testid="billing-tab"]')

    // Upgrade to premium
    await page.click('[data-testid="upgrade-premium-button"]')
    await page.waitForSelector('[data-testid="payment-form"]')

    // Fill payment details (test mode)
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')
    await page.fill('[data-testid="billing-zip"]', '10001')

    // Submit payment
    await page.click('[data-testid="submit-payment"]')
    await page.waitForSelector('[data-testid="payment-success"]')

    // Verify subscription active
    const subscriptionStatus = await page.locator('[data-testid="subscription-status"]').textContent()
    expect(subscriptionStatus).toContain('Premium')
  })

  test('Mobile responsive workflow', async ({ viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await page.waitForSelector('[data-testid="mobile-menu"]')

    // Navigate to projects
    await page.click('[data-testid="mobile-menu-projects"]')
    await page.waitForSelector('[data-testid="project-card"]')

    // Open project
    await page.click('[data-testid="project-card"]:first-child')

    // Verify responsive layout
    const isMobileLayout = await page.locator('[data-testid="mobile-layout"]').isVisible()
    expect(isMobileLayout).toBe(true)
  })

  test('Settings and preferences workflow', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Navigate to settings
    await page.click('[data-testid="settings-button"]')

    // Update profile
    await page.fill('[data-testid="display-name"]', 'Updated Name')
    await page.fill('[data-testid="bio"]', 'Test bio')
    await page.click('[data-testid="save-profile"]')
    await page.waitForSelector('[data-testid="profile-saved"]')

    // Change theme
    await page.click('[data-testid="appearance-tab"]')
    await page.click('[data-testid="dark-mode-toggle"]')
    await page.waitForTimeout(500)
    const isDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'))
    expect(isDark).toBe(true)

    // Update units
    await page.click('[data-testid="preferences-tab"]')
    await page.select('[data-testid="units-system"]', 'metric')
    await page.click('[data-testid="save-preferences"]')
    await page.waitForSelector('[data-testid="preferences-saved"]')

    // Configure notifications
    await page.click('[data-testid="notifications-tab"]')
    await page.check('[data-testid="email-notifications"]')
    await page.check('[data-testid="render-complete-notification"]')
    await page.click('[data-testid="save-notifications"]')
    await page.waitForSelector('[data-testid="notifications-saved"]')
  })

  test('Search and filter workflow', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Search projects
    await page.fill('[data-testid="search-input"]', 'Test Project')
    await page.waitForSelector('[data-testid="search-results"]')
    const results = await page.locator('[data-testid="search-result-item"]').count()
    expect(results).toBeGreaterThan(0)

    // Apply filters
    await page.click('[data-testid="filters-button"]')
    await page.check('[data-testid="filter-my-projects"]')
    await page.select('[data-testid="filter-sort"]', 'date-desc')
    await page.click('[data-testid="apply-filters"]')
    await page.waitForTimeout(500)

    // Navigate to model library
    await page.goto(`${BASE_URL}/models`)

    // Search models
    await page.fill('[data-testid="model-search"]', 'chair')
    await page.waitForSelector('[data-testid="model-results"]')

    // Filter by category
    await page.click('[data-testid="category-furniture"]')
    await page.waitForTimeout(500)

    // Filter by style
    await page.click('[data-testid="style-modern"]')
    await page.waitForTimeout(500)

    // Verify filtered results
    const modelResults = await page.locator('[data-testid="model-card"]').count()
    expect(modelResults).toBeGreaterThan(0)
  })

  test('Error handling and recovery', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Try to access non-existent project
    await page.goto(`${BASE_URL}/projects/non-existent-id`)
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
    expect(errorMessage).toContain('not found')

    // Navigate back to dashboard
    await page.click('[data-testid="back-to-dashboard"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Try invalid file upload
    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'Error Test')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    await page.click('[data-testid="upload-file-button"]')
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-fixtures/invalid.txt')
    await page.waitForSelector('[data-testid="upload-error"]')
    const uploadError = await page.locator('[data-testid="upload-error"]').textContent()
    expect(uploadError).toContain('Invalid file type')
  })

  test('Performance: Large scene handling', async () => {
    // Sign in and create project
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'Performance Test')
    await page.click('[data-testid="create-project-submit"]')
    await page.waitForURL(/\/projects\/.*/)

    // Navigate to Studio
    await page.click('[data-testid="open-studio-button"]')
    await page.waitForSelector('[data-testid="3d-canvas"]')

    // Load large scene (1000+ objects)
    await page.click('[data-testid="load-test-scene"]')
    await page.click('[data-testid="scene-large"]')

    const start = Date.now()
    await page.waitForSelector('[data-testid="scene-loaded"]', { timeout: 60000 })
    const loadTime = Date.now() - start

    expect(loadTime).toBeLessThan(10000) // Should load in under 10 seconds

    // Check FPS
    const fps = await page.evaluate(() => {
      return (window as any).currentFPS || 0
    })
    expect(fps).toBeGreaterThan(30) // Should maintain 30+ FPS
  })

  test('Accessibility: Keyboard navigation', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Navigate using keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // Open first project

    await page.waitForURL(/\/projects\/.*/)

    // Navigate in studio
    await page.keyboard.press('s') // Shortcut for studio
    await page.waitForSelector('[data-testid="3d-canvas"]')

    // Test keyboard shortcuts
    await page.keyboard.press('a') // Add model
    await page.waitForSelector('[data-testid="model-search"]')

    await page.keyboard.press('Escape') // Close dialog
    await page.waitForTimeout(500)

    // Verify focus management
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeDefined()
  })

  test('Offline mode and sync', async () => {
    // Sign in
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Go offline
    await page.context().setOffline(true)

    // Try to create project (should queue)
    await page.click('[data-testid="new-project-button"]')
    await page.fill('[data-testid="project-name"]', 'Offline Project')
    await page.click('[data-testid="create-project-submit"]')

    await page.waitForSelector('[data-testid="offline-queued"]')
    const offlineMessage = await page.locator('[data-testid="offline-message"]').textContent()
    expect(offlineMessage).toContain('offline')

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000) // Wait for sync

    // Verify project was synced
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForSelector('[data-testid="project-card"]')
    const projectExists = await page.locator('[data-testid="project-name"]', {
      hasText: 'Offline Project'
    }).isVisible()
    expect(projectExists).toBe(true)
  })
})
