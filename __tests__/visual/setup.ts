/**
 * Visual Regression Testing Setup
 *
 * Configures Percy for visual regression testing across components
 */

import percySnapshot from '@percy/playwright'
import { test as base } from '@playwright/test'

// Extend Playwright test with Percy
export const test = base.extend({
  // Add Percy context
  percySnapshot: async ({ page }, use) => {
    await use(async (name: string, options?: any) => {
      await percySnapshot(page, name, options)
    })
  }
})

export { expect } from '@playwright/test'

// Helper to wait for page to be ready for snapshot
export async function waitForPercy(page: any) {
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready)

  // Wait for images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve
        }))
    )
  })

  // Wait for animations to complete
  await page.waitForTimeout(500)

  // Mark page as ready
  await page.evaluate(() => {
    document.body.setAttribute('data-percy-ready', 'true')
  })
}

// Helper to hide dynamic content
export async function hideDynamicContent(page: any, selectors: string[] = []) {
  const defaultSelectors = [
    '[data-testid="timestamp"]',
    '[data-testid="random-id"]',
    '.percy-hide'
  ]

  const allSelectors = [...defaultSelectors, ...selectors]

  await page.evaluate((sels: string[]) => {
    sels.forEach(selector => {
      document.querySelectorAll(selector).forEach((el: any) => {
        el.style.visibility = 'hidden'
      })
    })
  }, allSelectors)
}

// Helper to set viewport sizes
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  largeDesktop: { width: 1920, height: 1080 }
}

// Helper to take responsive snapshots
export async function takeResponsiveSnapshots(
  page: any,
  percySnapshot: any,
  name: string,
  options: any = {}
) {
  for (const [device, viewport] of Object.entries(viewports)) {
    await page.setViewportSize(viewport)
    await waitForPercy(page)
    await percySnapshot(`${name} - ${device}`, {
      widths: [viewport.width],
      ...options
    })
  }
}

// Helper to mock API responses for consistent snapshots
export async function mockApiResponses(page: any) {
  await page.route('**/api/**', route => {
    const url = route.request().url()

    // Mock responses based on URL patterns
    if (url.includes('/api/projects')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          projects: [
            {
              id: '1',
              name: 'Test Project 1',
              status: 'active',
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              name: 'Test Project 2',
              status: 'completed',
              createdAt: '2024-01-02T00:00:00Z'
            }
          ]
        })
      })
    } else if (url.includes('/api/user')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        })
      })
    } else {
      route.continue()
    }
  })
}

// Helper to freeze time for consistent snapshots
export async function freezeTime(page: any, date: Date = new Date('2024-01-01T00:00:00Z')) {
  await page.addInitScript(`{
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${date.getTime()});
        } else {
          super(...args);
        }
      }

      static now() {
        return ${date.getTime()};
      }
    }
  }`)
}

// Helper to disable animations
export async function disableAnimations(page: any) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
}

// Helper for component testing
export async function testComponent(
  page: any,
  percySnapshot: any,
  componentPath: string,
  name: string,
  options: {
    variants?: string[]
    states?: string[]
    responsive?: boolean
    mockApis?: boolean
  } = {}
) {
  const { variants = [], states = [], responsive = true, mockApis = true } = options

  // Setup
  if (mockApis) {
    await mockApiResponses(page)
  }

  await freezeTime(page)
  await disableAnimations(page)

  // Navigate to component
  await page.goto(componentPath)

  // Test each variant and state
  for (const variant of variants.length > 0 ? variants : ['default']) {
    for (const state of states.length > 0 ? states : ['default']) {
      // Apply variant/state
      if (variant !== 'default') {
        await page.click(`[data-variant="${variant}"]`)
      }

      if (state !== 'default') {
        await page.click(`[data-state="${state}"]`)
      }

      await waitForPercy(page)

      const snapshotName = `${name}${variant !== 'default' ? ` - ${variant}` : ''}${state !== 'default' ? ` - ${state}` : ''}`

      if (responsive) {
        await takeResponsiveSnapshots(page, percySnapshot, snapshotName)
      } else {
        await percySnapshot(snapshotName)
      }
    }
  }
}
