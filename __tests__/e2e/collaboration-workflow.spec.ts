/**
 * Collaboration Workflow E2E Tests
 * Complete end-to-end workflow testing for collaboration features
 * Total: 10 tests
 *
 * Workflow: Invite users → Real-time editing → Comments → Version control
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456!'
}

test.describe('Collaboration Workflow E2E Tests', () => {
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

  // User Invitation Tests (2 tests)
  test('should invite collaborator to project', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')

    // Open share dialog
    await page.click('[data-testid="share-project-button"]')
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible()

    // Invite user
    await page.fill('[data-testid="invite-email-input"]', 'collaborator@example.com')
    await page.selectOption('[data-testid="role-select"]', 'editor')
    await page.click('[data-testid="send-invite-button"]')

    await expect(page.locator('[data-testid="invite-sent-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="collaborator-list"]')).toContainText('collaborator@example.com')
  })

  test('should manage collaborator permissions', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="share-project-button"]')

    // Change user role
    const collaboratorRow = page.locator('[data-testid="collaborator-row"]:first-child')
    await collaboratorRow.locator('[data-testid="role-dropdown"]').click()
    await page.click('[data-testid="role-option-viewer"]')

    await expect(page.locator('[data-testid="role-updated-toast"]')).toBeVisible()

    // Remove collaborator
    await collaboratorRow.locator('[data-testid="remove-collaborator"]').click()
    await page.click('[data-testid="confirm-remove-button"]')

    await expect(page.locator('[data-testid="collaborator-removed-toast"]')).toBeVisible()
  })

  // Real-time Editing Tests (2 tests)
  test('should show active users in real-time', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="studio-button"]')

    // Check active users panel
    await expect(page.locator('[data-testid="active-users-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-user-avatar"]')).toHaveCount(1) // Current user

    // Simulate another user joining (via WebSocket mock)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('user-joined', {
        detail: { userId: 'user-2', name: 'Collaborator', email: 'collab@example.com' }
      }))
    })

    await expect(page.locator('[data-testid="active-user-avatar"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('should show real-time cursor positions', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="studio-button"]')

    // Move cursor in viewport
    await page.mouse.move(500, 300)

    // Simulate other user cursor (via WebSocket mock)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('cursor-moved', {
        detail: { userId: 'user-2', x: 400, y: 250, name: 'Collaborator' }
      }))
    })

    // Check for cursor indicator
    await expect(page.locator('[data-testid="remote-cursor"]')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('[data-testid="remote-cursor"]')).toContainText('Collaborator')
  })

  // Comments Tests (3 tests)
  test('should add comment to model', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="studio-button"]')

    // Enable comment mode
    await page.click('[data-testid="comment-mode-button"]')

    // Click on model to add comment
    const canvas = page.locator('[data-testid="3d-canvas"]')
    await canvas.click({ position: { x: 400, y: 300 } })

    // Add comment text
    await page.fill('[data-testid="comment-input"]', 'This wall needs adjustment')
    await page.click('[data-testid="submit-comment-button"]')

    await expect(page.locator('[data-testid="comment-marker"]')).toBeVisible()
    await expect(page.locator('[data-testid="comment-thread"]')).toContainText('This wall needs adjustment')
  })

  test('should reply to comments', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="studio-button"]')

    // Open existing comment thread
    await page.click('[data-testid="comment-marker"]:first-child')
    await expect(page.locator('[data-testid="comment-thread"]')).toBeVisible()

    // Add reply
    await page.fill('[data-testid="reply-input"]', 'I agree, will fix this')
    await page.click('[data-testid="submit-reply-button"]')

    await expect(page.locator('[data-testid="comment-reply"]')).toContainText('I agree, will fix this')
  })

  test('should resolve comment threads', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="studio-button"]')

    // Open comment thread
    await page.click('[data-testid="comment-marker"]:first-child')

    // Resolve thread
    await page.click('[data-testid="resolve-thread-button"]')
    await expect(page.locator('[data-testid="thread-resolved-badge"]')).toBeVisible()

    // Verify marker changes appearance
    await expect(page.locator('[data-testid="comment-marker"]:first-child')).toHaveClass(/resolved/)
  })

  // Version Control Tests (3 tests)
  test('should create version snapshot', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')

    // Open versions panel
    await page.click('[data-testid="versions-button"]')
    await expect(page.locator('[data-testid="versions-panel"]')).toBeVisible()

    // Create snapshot
    await page.click('[data-testid="create-version-button"]')
    await page.fill('[data-testid="version-name-input"]', 'Design Review v1')
    await page.fill('[data-testid="version-notes-input"]', 'Initial design for client review')
    await page.click('[data-testid="save-version-button"]')

    await expect(page.locator('[data-testid="version-created-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="version-list-item"]:first-child')).toContainText('Design Review v1')
  })

  test('should compare versions', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="versions-button"]')

    // Select two versions to compare
    const version1 = page.locator('[data-testid="version-list-item"]:nth-child(1)')
    const version2 = page.locator('[data-testid="version-list-item"]:nth-child(2)')

    await version1.locator('[data-testid="version-checkbox"]').check()
    await version2.locator('[data-testid="version-checkbox"]').check()

    // Open compare view
    await page.click('[data-testid="compare-versions-button"]')
    await expect(page.locator('[data-testid="version-comparison-view"]')).toBeVisible()

    // Check split view
    await expect(page.locator('[data-testid="version-left-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="version-right-panel"]')).toBeVisible()
  })

  test('should restore previous version', async () => {
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="project-card"]:first-child')
    await page.click('[data-testid="versions-button"]')

    // Select older version
    const olderVersion = page.locator('[data-testid="version-list-item"]:nth-child(2)')
    await olderVersion.click()

    // Restore version
    await page.click('[data-testid="restore-version-button"]')
    await page.click('[data-testid="confirm-restore-button"]')

    await expect(page.locator('[data-testid="version-restored-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-version-badge"]')).toContainText(/Restored/)
  })
})

/**
 * Test Summary:
 * - User Invitation: 2 tests (invite collaborator, manage permissions)
 * - Real-time Editing: 2 tests (active users, cursor positions)
 * - Comments: 3 tests (add comment, reply, resolve)
 * - Version Control: 3 tests (create snapshot, compare versions, restore)
 *
 * Total: 10 comprehensive E2E tests covering collaboration workflow
 */
