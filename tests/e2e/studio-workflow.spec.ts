/**
 * E2E Tests - Studio Workflow
 *
 * Complete end-to-end test coverage for core user workflows
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Complete Studio Workflow', () => {
  test('User can create a project, add models, and export', async ({ page }) => {
    // 1. Navigate to studio
    await page.goto(`${BASE_URL}/studio`)
    await expect(page).toHaveTitle(/Studio/)

    // 2. Wait for 3D canvas to load
    await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 })

    // 3. Add a floor model
    await page.click('[data-testid="add-model-btn"]')
    await page.fill('[data-testid="search-models"]', 'floor')
    await page.click('[data-testid="model-floor"]')
    await page.waitForTimeout(2000) // Wait for model to load in scene

    // 4. Verify model added to scene
    const sceneObjects = await page.locator('[data-testid="scene-object"]').count()
    expect(sceneObjects).toBeGreaterThan(0)

    // 5. Add furniture
    await page.click('[data-testid="add-model-btn"]')
    await page.fill('[data-testid="search-models"]', 'chair')
    await page.click('[data-testid="model-chair"]')
    await page.waitForTimeout(2000)

    // 6. Transform object (move, scale)
    await page.click('[data-testid="scene-object"]:first-child')
    await page.click('[data-testid="transform-move"]')
    // Simulate drag interaction
    await page.mouse.move(500, 300)
    await page.mouse.down()
    await page.mouse.move(550, 300)
    await page.mouse.up()

    // 7. Apply material
    await page.click('[data-testid="materials-tab"]')
    await page.click('[data-testid="material-wood"]')
    await expect(page.locator('[data-testid="active-material"]')).toContainText('Wood')

    // 8. Adjust lighting
    await page.click('[data-testid="lighting-tab"]')
    await page.fill('[data-testid="light-intensity"]', '1.5')

    // 9. Save project
    await page.click('[data-testid="save-project-btn"]')
    await page.fill('[data-testid="project-name"]', 'E2E Test Project')
    await page.click('[data-testid="confirm-save"]')

    // 10. Wait for save confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible()

    // 11. Export scene
    await page.click('[data-testid="export-btn"]')
    await page.click('[data-testid="export-gltf"]')

    // 12. Wait for download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="confirm-export"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.gltf')
  })

  test('Collaboration - Share project with team', async ({ page }) => {
    await page.goto(`${BASE_URL}/studio`)

    // Open existing project
    await page.click('[data-testid="projects-btn"]')
    await page.click('[data-testid="project-1"]')
    await page.waitForSelector('[data-testid="3d-canvas"]')

    // Share project
    await page.click('[data-testid="share-btn"]')
    await page.fill('[data-testid="share-email"]', 'teammate@example.com')
    await page.selectOption('[data-testid="share-permission"]', 'edit')
    await page.click('[data-testid="send-invite"]')

    // Verify success
    await expect(page.locator('[data-testid="invite-sent"]')).toBeVisible()
  })

  test('BIM Integration - Import IFC file', async ({ page }) => {
    await page.goto(`${BASE_URL}/studio`)

    // Open import dialog
    await page.click('[data-testid="import-btn"]')
    await page.click('[data-testid="import-ifc"]')

    // Upload IFC file
    const fileInput = await page.locator('[data-testid="file-upload"]')
    await fileInput.setInputFiles('tests/fixtures/sample.ifc')

    // Wait for processing
    await expect(page.locator('[data-testid="processing"]')).toBeVisible()
    await page.waitForSelector('[data-testid="import-success"]', { timeout: 30000 })

    // Verify IFC elements loaded
    const elements = await page.locator('[data-testid="ifc-element"]').count()
    expect(elements).toBeGreaterThan(0)
  })

  test('AI Features - Lighting optimization', async ({ page }) => {
    await page.goto(`${BASE_URL}/studio`)
    await page.waitForSelector('[data-testid="3d-canvas"]')

    // Add basic scene
    await page.click('[data-testid="add-model-btn"]')
    await page.click('[data-testid="model-room"]')
    await page.waitForTimeout(2000)

    // Open AI lighting panel
    await page.click('[data-testid="ai-tools"]')
    await page.click('[data-testid="lighting-optimizer"]')

    // Select optimization goal
    await page.click('[data-testid="goal-natural"]')
    await page.click('[data-testid="run-optimization"]')

    // Wait for optimization
    await expect(page.locator('[data-testid="optimizing"]')).toBeVisible()
    await page.waitForSelector('[data-testid="optimization-complete"]', { timeout: 15000 })

    // Verify lights added
    const lights = await page.locator('[data-testid="light-source"]').count()
    expect(lights).toBeGreaterThan(0)
  })

  test('Performance - Load large scene (1000+ objects)', async ({ page }) => {
    await page.goto(`${BASE_URL}/studio`)

    // Load stress test scene
    await page.click('[data-testid="load-test-scene"]')
    await page.click('[data-testid="scene-large"]')

    // Measure load time
    const startTime = Date.now()
    await page.waitForSelector('[data-testid="scene-loaded"]', { timeout: 60000 })
    const loadTime = Date.now() - startTime

    // Verify performance (should load in under 10 seconds)
    expect(loadTime).toBeLessThan(10000)

    // Verify frame rate is acceptable
    const fps = await page.evaluate(() => {
      return (window as any).currentFPS || 0
    })
    expect(fps).toBeGreaterThan(30)
  })

  test('Mobile responsive - Studio works on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/studio`)

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Verify touch controls work
    await page.click('[data-testid="3d-canvas"]')
    // Simulate pinch zoom
    await page.touchscreen.tap(400, 500)

    // Verify model can be added
    await page.click('[data-testid="mobile-add-btn"]')
    await page.click('[data-testid="model-cube"]')
    await page.waitForTimeout(1000)

    const objects = await page.locator('[data-testid="scene-object"]').count()
    expect(objects).toBeGreaterThan(0)
  })
})

test.describe('Critical User Flows', () => {
  test('Authentication flow', async ({ page }) => {
    // 1. Visit homepage
    await page.goto(BASE_URL)

    // 2. Click sign in
    await page.click('[data-testid="sign-in-btn"]')

    // 3. Enter credentials
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpassword123')

    // 4. Submit
    await page.click('[data-testid="submit-login"]')

    // 5. Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('Model library search and filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/library`)

    // Search
    await page.fill('[data-testid="search-input"]', 'modern chair')
    await page.waitForTimeout(500)

    // Verify results
    const results = await page.locator('[data-testid="model-card"]').count()
    expect(results).toBeGreaterThan(0)

    // Apply filter
    await page.click('[data-testid="filter-category"]')
    await page.click('[data-testid="category-furniture"]')
    await page.waitForTimeout(500)

    // Verify filtered
    const filtered = await page.locator('[data-testid="model-card"]').count()
    expect(filtered).toBeLessThanOrEqual(results)

    // Open model detail
    await page.click('[data-testid="model-card"]:first-child')
    await expect(page.locator('[data-testid="model-detail"]')).toBeVisible()

    // Add to project
    await page.click('[data-testid="add-to-project"]')
    await page.click('[data-testid="project-current"]')
    await expect(page.locator('[data-testid="added-success"]')).toBeVisible()
  })

  test('Settings and preferences', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)

    // Update display name
    await page.fill('[data-testid="display-name"]', 'E2E Test User')

    // Toggle dark mode
    await page.click('[data-testid="dark-mode-toggle"]')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Change units
    await page.selectOption('[data-testid="units"]', 'metric')

    // Save changes
    await page.click('[data-testid="save-settings"]')
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible()

    // Reload and verify persistence
    await page.reload()
    const name = await page.inputValue('[data-testid="display-name"]')
    expect(name).toBe('E2E Test User')
  })

  test('Payment and subscription flow', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/pricing`)

    // Select plan
    await page.click('[data-testid="plan-pro"]')
    await page.click('[data-testid="subscribe-btn"]')

    // Enter payment info (using Stripe test mode)
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]')

    const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await frame.locator('[name="cardnumber"]').fill('4242424242424242')
    await frame.locator('[name="exp-date"]').fill('12/25')
    await frame.locator('[name="cvc"]').fill('123')

    // Submit payment
    await page.click('[data-testid="submit-payment"]')

    // Wait for success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/dashboard/)
  })
})
