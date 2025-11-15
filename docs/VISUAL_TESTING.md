# Visual Regression Testing Guide

This guide explains how to set up and run visual regression tests for Abode AI using Percy.

## Overview

Visual regression testing helps catch unintended visual changes in the UI by comparing screenshots across builds. We use Percy (by BrowserStack) for visual testing.

## Prerequisites

- Node.js 18+ installed
- Percy account (sign up at https://percy.io)
- Percy project created

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev @percy/cli @percy/playwright playwright @playwright/test
```

### 2. Configure Percy Token

Get your Percy token from https://percy.io/settings and set it as an environment variable:

```bash
# Add to .env.local
PERCY_TOKEN=your_percy_token_here
```

Or export it in your shell:

```bash
export PERCY_TOKEN=your_percy_token_here
```

### 3. Configuration Files

The following configuration files are already set up:

- `.percy.yml` - Percy configuration (snapshots, widths, thresholds)
- `playwright.config.visual.ts` - Playwright configuration for visual tests
- `__tests__/visual/setup.ts` - Visual testing utilities and helpers

## Running Visual Tests

### Local Development

Run all visual tests locally:

```bash
npm run test:visual
```

Or use the script directly:

```bash
./scripts/run-visual-tests.sh
```

### Without Percy Token (Dry Run)

You can run visual tests without uploading to Percy (useful for debugging):

```bash
npx playwright test __tests__/visual --config=playwright.config.visual.ts
```

### Run Specific Tests

```bash
# Test only pages
npx percy exec -- playwright test __tests__/visual/pages.visual.test.ts

# Test only components
npx percy exec -- playwright test __tests__/visual/components.visual.test.ts
```

### CI/CD Integration

Visual tests run automatically on pull requests when `PERCY_TOKEN` is set in CI environment variables.

```yaml
# .github/workflows/visual-tests.yml
name: Visual Tests

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - name: Run visual tests
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        run: npm run test:visual
```

## Writing Visual Tests

### Basic Page Test

```typescript
import { test, waitForPercy } from './setup'
import percySnapshot from '@percy/playwright'

test('My Page', async ({ page }) => {
  await page.goto('/my-page')
  await waitForPercy(page)

  await percySnapshot(page, 'My Page')
})
```

### Responsive Testing

```typescript
import { test, takeResponsiveSnapshots } from './setup'
import percySnapshot from '@percy/playwright'

test('Responsive Page', async ({ page }) => {
  await page.goto('/my-page')

  // Takes snapshots at mobile, tablet, desktop, and large desktop sizes
  await takeResponsiveSnapshots(page, percySnapshot, 'My Page')
})
```

### Component Testing

```typescript
import { test, testComponent } from './setup'
import percySnapshot from '@percy/playwright'

test('Button Component', async ({ page }) => {
  await testComponent(page, percySnapshot, '/test/button', 'Button', {
    variants: ['default', 'primary', 'secondary'],
    states: ['default', 'hover', 'disabled'],
    responsive: true
  })
})
```

### Testing Different States

```typescript
test('Form with States', async ({ page }) => {
  await page.goto('/form')
  await waitForPercy(page)

  // Default state
  await percySnapshot(page, 'Form - Default')

  // Error state
  await page.click('[data-testid="submit"]')
  await waitForPercy(page)
  await percySnapshot(page, 'Form - Errors')

  // Filled state
  await page.fill('[name="email"]', 'test@example.com')
  await waitForPercy(page)
  await percySnapshot(page, 'Form - Filled')
})
```

## Helper Functions

### `waitForPercy(page)`

Waits for page to be ready for snapshot:
- Fonts loaded
- Images loaded
- Animations complete

### `takeResponsiveSnapshots(page, percySnapshot, name, options)`

Takes snapshots at multiple viewport sizes:
- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1280x720
- Large Desktop: 1920x1080

### `mockApiResponses(page)`

Mocks API responses for consistent snapshots.

### `freezeTime(page, date)`

Freezes JavaScript Date for consistent timestamps.

### `disableAnimations(page)`

Disables CSS animations for stable snapshots.

### `hideDynamicContent(page, selectors)`

Hides elements that change frequently (timestamps, random IDs, etc.).

## Best Practices

### 1. Hide Dynamic Content

```typescript
// In your component
<div className="percy-hide" data-testid="timestamp">
  {new Date().toISOString()}
</div>
```

Or use Percy CSS in `.percy.yml`:

```yaml
percy-css: |
  [data-testid="timestamp"] {
    visibility: hidden !important;
  }
```

### 2. Disable Animations

Animations are automatically disabled by the setup utilities, but you can also use:

```typescript
await disableAnimations(page)
```

### 3. Mock Data

Always use consistent mock data:

```typescript
test.beforeEach(async ({ page }) => {
  await mockApiResponses(page)
  await freezeTime(page, new Date('2024-01-01'))
})
```

### 4. Wait for Async Content

```typescript
// Wait for specific element
await page.waitForSelector('[data-testid="content-loaded"]')

// Wait for network idle
await page.waitForLoadState('networkidle')

// Then take snapshot
await waitForPercy(page)
await percySnapshot(page, 'Page Name')
```

### 5. Test Critical Paths

Focus on:
- Landing pages
- Authentication flows
- Main navigation
- Critical user journeys
- Complex components

### 6. Test Breakpoints

Test at key responsive breakpoints:
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)
- Large Desktop (1920px)

## Reviewing Changes

### Percy Dashboard

1. Go to https://percy.io/
2. Select your project
3. View builds and comparisons
4. Approve or reject changes

### Build Status

Percy will post build status to:
- Pull request checks
- Build status API
- Percy dashboard

### Approval Workflow

1. Percy detects visual changes
2. Review changes in Percy dashboard
3. Approve legitimate changes
4. Reject unintended changes
5. Build passes when all changes approved

## Troubleshooting

### "Percy token not found"

Set `PERCY_TOKEN` environment variable:

```bash
export PERCY_TOKEN=your_token_here
```

### "Snapshots look different locally vs CI"

Ensure consistent:
- Font loading
- Image loading
- API mocking
- Time freezing
- Animation disabling

### "Too many snapshots"

Percy has limits based on plan. Optimize by:
- Combining related snapshots
- Using fewer responsive breakpoints for less critical pages
- Testing components in isolation instead of full pages

### "Flaky snapshots"

Common causes:
- Animations not disabled
- Fonts not loaded
- Dynamic content not hidden
- Network requests not mocked
- Timing issues

Fix with:
```typescript
await waitForPercy(page)  // Ensures everything is ready
await disableAnimations(page)
await mockApiResponses(page)
await freezeTime(page)
```

## Cost Optimization

Percy pricing is based on snapshots per month. To optimize:

1. **Run selectively in CI**
   - Only on pull requests
   - Skip on draft PRs

2. **Reduce snapshot count**
   - Test critical paths first
   - Combine related states
   - Use fewer breakpoints for less important pages

3. **Use dry runs**
   - Run locally without Percy to debug
   - Only upload when ready

## Resources

- [Percy Documentation](https://docs.percy.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Percy Playwright SDK](https://docs.percy.io/docs/playwright)
- [Visual Testing Best Practices](https://docs.percy.io/docs/visual-testing-basics)

## Support

For issues or questions:
- Check Percy documentation
- Review existing test examples
- Contact team on Slack #visual-testing
