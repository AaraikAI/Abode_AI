/**
 * Visual Regression Tests for Components
 *
 * Tests visual appearance of individual components and their variants
 */

import { test, expect, waitForPercy, testComponent } from './setup'
import percySnapshot from '@percy/playwright'

test.describe('UI Component Visual Tests', () => {
  test('Button Component - All Variants', async ({ page }) => {
    await page.goto('/test/components/button')
    await waitForPercy(page)

    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    const sizes = ['default', 'sm', 'lg', 'icon']

    for (const variant of variants) {
      for (const size of sizes) {
        await page.click(`[data-variant="${variant}"][data-size="${size}"]`)
        await waitForPercy(page)
        await percySnapshot(page, `Button - ${variant} - ${size}`)
      }
    }

    // Test states
    await percySnapshot(page, 'Button - Disabled')
    await percySnapshot(page, 'Button - Loading')
  })

  test('Card Component', async ({ page }) => {
    await testComponent(page, percySnapshot, '/test/components/card', 'Card', {
      variants: ['default', 'hover', 'selected'],
      responsive: true
    })
  })

  test('Dialog/Modal Component', async ({ page }) => {
    await page.goto('/test/components/dialog')
    await waitForPercy(page)

    await page.click('[data-testid="open-dialog"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Dialog - Open')

    // Test different sizes
    const sizes = ['sm', 'md', 'lg', 'xl', 'full']
    for (const size of sizes) {
      await page.click(`[data-size="${size}"]`)
      await waitForPercy(page)
      await percySnapshot(page, `Dialog - ${size}`)
    }
  })

  test('Form Components', async ({ page }) => {
    await page.goto('/test/components/form')
    await waitForPercy(page)

    await percySnapshot(page, 'Form - Default')

    // Test validation states
    await page.click('[data-testid="submit"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Form - Validation Errors')

    // Test filled state
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await waitForPercy(page)
    await percySnapshot(page, 'Form - Filled')
  })

  test('Table Component', async ({ page }) => {
    await page.goto('/test/components/table')
    await waitForPercy(page)

    await percySnapshot(page, 'Table - Default')

    // Test sorting
    await page.click('[data-testid="sort-name"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Table - Sorted')

    // Test with selection
    await page.click('[data-testid="select-row-1"]')
    await page.click('[data-testid="select-row-3"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Table - With Selection')
  })

  test('Navigation Components', async ({ page }) => {
    await page.goto('/test/components/navigation')
    await waitForPercy(page)

    await percySnapshot(page, 'Navigation - Desktop')

    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 })
    await waitForPercy(page)
    await percySnapshot(page, 'Navigation - Mobile')

    await page.click('[data-testid="mobile-menu"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Navigation - Mobile Menu Open')
  })

  test('Dropdown/Select Component', async ({ page }) => {
    await page.goto('/test/components/select')
    await waitForPercy(page)

    await percySnapshot(page, 'Select - Closed')

    await page.click('[data-testid="select-trigger"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Select - Open')

    // Test with search
    await page.fill('[data-testid="select-search"]', 'test')
    await waitForPercy(page)
    await percySnapshot(page, 'Select - Filtered')
  })

  test('Toast/Notification Component', async ({ page }) => {
    await page.goto('/test/components/toast')
    await waitForPercy(page)

    const variants = ['default', 'success', 'error', 'warning', 'info']
    for (const variant of variants) {
      await page.click(`[data-toast="${variant}"]`)
      await waitForPercy(page)
      await percySnapshot(page, `Toast - ${variant}`)
    }
  })

  test('Tooltip Component', async ({ page }) => {
    await page.goto('/test/components/tooltip')
    await waitForPercy(page)

    await page.hover('[data-testid="tooltip-trigger"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Tooltip - Visible')

    // Test different positions
    const positions = ['top', 'right', 'bottom', 'left']
    for (const position of positions) {
      await page.hover(`[data-position="${position}"]`)
      await waitForPercy(page)
      await percySnapshot(page, `Tooltip - ${position}`)
    }
  })
})

test.describe('3D Viewer Component', () => {
  test('3D Viewer - Default', async ({ page }) => {
    await page.goto('/test/components/3d-viewer')
    await page.waitForTimeout(2000) // Wait for 3D model to load
    await waitForPercy(page)

    await percySnapshot(page, '3D Viewer - Default')
  })

  test('3D Viewer - Controls', async ({ page }) => {
    await page.goto('/test/components/3d-viewer')
    await page.waitForTimeout(2000)

    // Test different viewing modes
    await page.click('[data-testid="wireframe-mode"]')
    await waitForPercy(page)
    await percySnapshot(page, '3D Viewer - Wireframe')

    await page.click('[data-testid="textured-mode"]')
    await waitForPercy(page)
    await percySnapshot(page, '3D Viewer - Textured')
  })
})

test.describe('Chart Components', () => {
  test('Bar Chart', async ({ page }) => {
    await page.goto('/test/components/charts/bar')
    await waitForPercy(page)

    await percySnapshot(page, 'Bar Chart')
  })

  test('Line Chart', async ({ page }) => {
    await page.goto('/test/components/charts/line')
    await waitForPercy(page)

    await percySnapshot(page, 'Line Chart')
  })

  test('Pie Chart', async ({ page }) => {
    await page.goto('/test/components/charts/pie')
    await waitForPercy(page)

    await percySnapshot(page, 'Pie Chart')
  })
})

test.describe('Upload Components', () => {
  test('File Upload - Empty', async ({ page }) => {
    await page.goto('/test/components/upload')
    await waitForPercy(page)

    await percySnapshot(page, 'File Upload - Empty')
  })

  test('File Upload - With Files', async ({ page }) => {
    await page.goto('/test/components/upload')

    // Simulate file upload
    await page.setInputFiles('[data-testid="file-input"]', [
      { name: 'model.glb', mimeType: 'model/gltf-binary', buffer: Buffer.from('mock') }
    ])

    await waitForPercy(page)
    await percySnapshot(page, 'File Upload - With Files')
  })

  test('File Upload - Progress', async ({ page }) => {
    await page.goto('/test/components/upload')

    await page.setInputFiles('[data-testid="file-input"]', [
      { name: 'large-model.glb', mimeType: 'model/gltf-binary', buffer: Buffer.from('mock') }
    ])

    // Simulate upload progress
    await page.evaluate(() => {
      (window as any).setUploadProgress(50)
    })

    await waitForPercy(page)
    await percySnapshot(page, 'File Upload - Progress')
  })
})

test.describe('Search Components', () => {
  test('Search Bar - Empty', async ({ page }) => {
    await page.goto('/test/components/search')
    await waitForPercy(page)

    await percySnapshot(page, 'Search - Empty')
  })

  test('Search Bar - With Results', async ({ page }) => {
    await page.goto('/test/components/search')

    await page.fill('[data-testid="search-input"]', 'modern chair')
    await waitForPercy(page)

    await percySnapshot(page, 'Search - With Results')
  })

  test('Search Bar - No Results', async ({ page }) => {
    await page.goto('/test/components/search')

    await page.fill('[data-testid="search-input"]', 'nonexistent item xyz123')
    await waitForPercy(page)

    await percySnapshot(page, 'Search - No Results')
  })
})

test.describe('Pricing Components', () => {
  test('Pricing Cards', async ({ page }) => {
    await page.goto('/test/components/pricing')
    await waitForPercy(page)

    await percySnapshot(page, 'Pricing Cards')

    // Test different billing cycles
    await page.click('[data-testid="billing-annual"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Pricing Cards - Annual')
  })
})

test.describe('Voice Command Components', () => {
  test('Voice Command Button', async ({ page }) => {
    await page.goto('/test/components/voice-command')
    await waitForPercy(page)

    await percySnapshot(page, 'Voice Command - Inactive')

    await page.click('[data-testid="voice-button"]')
    await waitForPercy(page)
    await percySnapshot(page, 'Voice Command - Listening')
  })
})

test.describe('Language Switcher', () => {
  test('Language Switcher - Closed', async ({ page }) => {
    await page.goto('/test/components/language-switcher')
    await waitForPercy(page)

    await percySnapshot(page, 'Language Switcher - Closed')
  })

  test('Language Switcher - Open', async ({ page }) => {
    await page.goto('/test/components/language-switcher')

    await page.click('[data-testid="language-trigger"]')
    await waitForPercy(page)

    await percySnapshot(page, 'Language Switcher - Open')
  })
})
