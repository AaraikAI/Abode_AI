/**
 * White-Label Setup Workflow E2E Tests
 * Complete end-to-end workflow testing for multi-tenant white-labeling
 * Total: 10 tests
 *
 * Workflow: Create tenant → Branding customization → User management → Subdomain configuration
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_USER = { email: 'admin@abode-ai.com', password: 'Admin123456!' }

test.describe('White-Label Setup Workflow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', ADMIN_USER.email)
    await page.fill('[data-testid="password-input"]', ADMIN_USER.password)
    await page.click('[data-testid="signin-button"]')
    await expect(page).toHaveURL(/\\/dashboard/)
  })

  test.afterEach(async () => {
    await page.close()
  })

  // Tenant Creation Tests (3 tests)
  test('should create new tenant organization', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)

    await page.click('[data-testid="create-tenant-button"]')
    await page.fill('[data-testid="tenant-name-input"]', 'Acme Architecture Firm')
    await page.fill('[data-testid="tenant-slug-input"]', 'acme-architecture')
    await page.fill('[data-testid="admin-email-input"]', 'admin@acmearch.com')
    await page.fill('[data-testid="admin-name-input"]', 'John Doe')

    await page.click('[data-testid="create-tenant-submit-button"]')
    await expect(page.locator('[data-testid="tenant-created-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="tenant-list"]')).toContainText('Acme Architecture Firm')
  })

  test('should configure tenant subscription plan', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')

    await page.click('[data-testid="subscription-tab"]')
    await page.selectOption('[data-testid="plan-select"]', 'professional')
    await page.fill('[data-testid="user-limit-input"]', '50')
    await page.fill('[data-testid="storage-limit-input"]', '500')
    await page.selectOption('[data-testid="billing-cycle-select"]', 'monthly')

    await page.click('[data-testid="save-subscription-button"]')
    await expect(page.locator('[data-testid="subscription-updated-toast"]')).toBeVisible()
  })

  test('should view tenant dashboard and metrics', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')

    await expect(page.locator('[data-testid="active-users-count"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="projects-count"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="storage-usage"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="api-calls-count"]')).toContainText(/\d+/)
  })

  // Branding Customization Tests (2 tests)
  test('should customize tenant branding', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="branding-tab"]')

    // Upload logo
    const logoInput = page.locator('[data-testid="logo-upload-input"]')
    await logoInput.setInputFiles({
      name: 'company-logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('PNG image data')
    })

    // Upload favicon
    const faviconInput = page.locator('[data-testid="favicon-upload-input"]')
    await faviconInput.setInputFiles({
      name: 'favicon.ico',
      mimeType: 'image/x-icon',
      buffer: Buffer.from('ICO image data')
    })

    // Set brand colors
    await page.fill('[data-testid="primary-color-input"]', '#1E40AF')
    await page.fill('[data-testid="secondary-color-input"]', '#10B981')
    await page.fill('[data-testid="accent-color-input"]', '#F59E0B')

    await page.click('[data-testid="save-branding-button"]')
    await expect(page.locator('[data-testid="branding-saved-toast"]')).toBeVisible()
  })

  test('should customize email templates and domain', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="branding-tab"]')

    await page.click('[data-testid="email-templates-section"]')
    await page.fill('[data-testid="from-name-input"]', 'Acme Architecture')
    await page.fill('[data-testid="from-email-input"]', 'noreply@acmearch.com')
    await page.fill('[data-testid="support-email-input"]', 'support@acmearch.com')

    // Customize welcome email
    await page.click('[data-testid="welcome-email-template"]')
    await page.fill('[data-testid="email-subject-input"]', 'Welcome to Acme Architecture Platform')
    await page.fill('[data-testid="email-body-input"]', 'Welcome to our platform! We are excited to have you.')

    await page.click('[data-testid="save-email-templates-button"]')
    await expect(page.locator('[data-testid="templates-saved-toast"]')).toBeVisible()
  })

  // User Management Tests (2 tests)
  test('should invite users to tenant organization', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="users-tab"]')

    await page.click('[data-testid="invite-user-button"]')
    await page.fill('[data-testid="user-email-input"]', 'architect@acmearch.com')
    await page.fill('[data-testid="user-name-input"]', 'Jane Smith')
    await page.selectOption('[data-testid="user-role-select"]', 'admin')

    await page.click('[data-testid="send-invite-button"]')
    await expect(page.locator('[data-testid="invite-sent-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-list"]')).toContainText('architect@acmearch.com')
  })

  test('should manage user roles and permissions', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="users-tab"]')

    // Click on existing user
    await page.click('[data-testid="user-row"]:first-child')
    await page.click('[data-testid="edit-permissions-button"]')

    // Update role
    await page.selectOption('[data-testid="role-select"]', 'editor')

    // Set specific permissions
    await page.check('[data-testid="permission-create-projects"]')
    await page.check('[data-testid="permission-edit-models"]')
    await page.uncheck('[data-testid="permission-delete-projects"]')

    await page.click('[data-testid="save-permissions-button"]')
    await expect(page.locator('[data-testid="permissions-updated-toast"]')).toBeVisible()
  })

  // Subdomain Configuration Tests (2 tests)
  test('should configure custom subdomain', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="domain-tab"]')

    await page.fill('[data-testid="subdomain-input"]', 'acme')
    await page.click('[data-testid="check-availability-button"]')

    await expect(page.locator('[data-testid="availability-status"]')).toContainText(/Available|Unavailable/)

    // If available, save
    const isAvailable = await page.locator('[data-testid="availability-status"]').textContent()
    if (isAvailable?.includes('Available')) {
      await page.click('[data-testid="save-subdomain-button"]')
      await expect(page.locator('[data-testid="subdomain-saved-toast"]')).toBeVisible()
      await expect(page.locator('[data-testid="tenant-url"]')).toContainText('acme.abode-ai.com')
    }
  })

  test('should configure custom domain with SSL', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="domain-tab"]')

    await page.click('[data-testid="custom-domain-section"]')
    await page.fill('[data-testid="custom-domain-input"]', 'platform.acmearch.com')
    await page.click('[data-testid="verify-domain-button"]')

    // Show DNS records that need to be configured
    await expect(page.locator('[data-testid="dns-records"]')).toBeVisible()
    await expect(page.locator('[data-testid="cname-record"]')).toContainText(/CNAME/)

    // Enable SSL
    await page.check('[data-testid="enable-ssl-checkbox"]')
    await page.selectOption('[data-testid="ssl-provider-select"]', 'letsencrypt')

    await page.click('[data-testid="save-custom-domain-button"]')
    await expect(page.locator('[data-testid="domain-configuration-toast"]')).toBeVisible()
  })

  // Feature Toggles Test (1 test)
  test('should configure feature toggles for tenant', async () => {
    await page.goto(`${BASE_URL}/admin/tenants`)
    await page.click('[data-testid="tenant-card"]:first-child')
    await page.click('[data-testid="features-tab"]')

    // Core features
    await page.check('[data-testid="feature-3d-rendering"]')
    await page.check('[data-testid="feature-collaboration"]')
    await page.check('[data-testid="feature-cost-estimation"]')

    // Advanced features
    await page.check('[data-testid="feature-ai-design"]')
    await page.uncheck('[data-testid="feature-blockchain"]')
    await page.check('[data-testid="feature-iot-integration"]')
    await page.uncheck('[data-testid="feature-vr-ar"]')

    // API features
    await page.check('[data-testid="feature-api-access"]')
    await page.fill('[data-testid="api-rate-limit-input"]', '10000')

    await page.click('[data-testid="save-features-button"]')
    await expect(page.locator('[data-testid="features-updated-toast"]')).toBeVisible()
  })
})

/**
 * Test Summary:
 * - Tenant Creation: 3 tests (create tenant, configure subscription, view dashboard)
 * - Branding Customization: 2 tests (customize branding, email templates)
 * - User Management: 2 tests (invite users, manage roles/permissions)
 * - Subdomain Configuration: 2 tests (configure subdomain, custom domain with SSL)
 * - Feature Toggles: 1 test (configure tenant features)
 *
 * Total: 10 comprehensive E2E tests covering white-label setup workflow
 */
