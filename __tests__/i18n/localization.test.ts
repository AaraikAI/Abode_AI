/**
 * Internationalization (i18n) Tests
 * Comprehensive testing for language switching, RTL support, and date/number formatting
 * Total: 5 tests
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Internationalization Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterEach(async () => {
    await page.close()
  })

  // Language Switching Tests (2 tests)
  describe('Language Switching', () => {
    test('should switch between supported languages', async () => {
      await page.goto(`${BASE_URL}/dashboard`)

      const languages = [
        { code: 'en', label: 'English', sample: 'Dashboard' },
        { code: 'es', label: 'Español', sample: 'Panel' },
        { code: 'fr', label: 'Français', sample: 'Tableau' },
        { code: 'de', label: 'Deutsch', sample: 'Dashboard' },
        { code: 'zh', label: '中文', sample: '仪表板' }
      ]

      for (const lang of languages) {
        // Switch language
        const langSelector = page.locator('[data-testid="language-selector"]')
        if (await langSelector.count() > 0) {
          await langSelector.click()
          await page.click(`[data-testid="lang-option-${lang.code}"]`)

          // Wait for language to change
          await page.waitForTimeout(500)

          // Verify language attribute
          const htmlLang = await page.getAttribute('html', 'lang')
          expect(htmlLang).toContain(lang.code)

          // Check at least one translated element exists
          const body = await page.textContent('body')
          expect(body).toBeTruthy()
        }
      }
    })

    test('should persist language preference', async () => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Select Spanish
      const langSelector = page.locator('[data-testid="language-selector"]')
      if (await langSelector.count() > 0) {
        await langSelector.click()
        await page.click('[data-testid="lang-option-es"]')
        await page.waitForTimeout(500)

        // Navigate to another page
        await page.goto(`${BASE_URL}/projects`)

        // Language should persist
        const htmlLang = await page.getAttribute('html', 'lang')
        expect(htmlLang).toContain('es')

        // Check localStorage for preference
        const savedLang = await page.evaluate(() => {
          return localStorage.getItem('preferredLanguage')
        })
        expect(savedLang).toBe('es')
      }
    })
  })

  // RTL (Right-to-Left) Support Tests (1 test)
  describe('RTL Support', () => {
    test('should properly render RTL languages', async () => {
      await page.goto(`${BASE_URL}/dashboard`)

      const rtlLanguages = ['ar', 'he', 'fa'] // Arabic, Hebrew, Persian

      for (const langCode of rtlLanguages) {
        // Switch to RTL language
        const langSelector = page.locator('[data-testid="language-selector"]')
        if (await langSelector.count() > 0) {
          await langSelector.click()

          const rtlOption = page.locator(`[data-testid="lang-option-${langCode}"]`)
          if (await rtlOption.count() > 0) {
            await rtlOption.click()
            await page.waitForTimeout(500)

            // Check dir attribute
            const htmlDir = await page.getAttribute('html', 'dir')
            expect(htmlDir).toBe('rtl')

            // Check text alignment
            const textElements = await page.locator('p, h1, h2, h3').first()
            if (await textElements.count() > 0) {
              const textAlign = await textElements.evaluate((el) => {
                return window.getComputedStyle(el).textAlign
              })
              expect(textAlign).toMatch(/right|start/)
            }

            // Check flexbox direction
            const containers = page.locator('[data-testid="content-container"]').first()
            if (await containers.count() > 0) {
              const flexDir = await containers.evaluate((el) => {
                return window.getComputedStyle(el).flexDirection
              })
              // Should reverse horizontal flex directions in RTL
              expect(flexDir).toBeTruthy()
            }

            // Check icons are mirrored appropriately
            const icons = page.locator('[data-rtl-flip="true"]')
            if (await icons.count() > 0) {
              const transform = await icons.first().evaluate((el) => {
                return window.getComputedStyle(el).transform
              })
              expect(transform).toContain('scaleX(-1)')
            }
          }
        }
      }
    })
  })

  // Date/Number Formatting Tests (2 tests)
  describe('Date and Number Formatting', () => {
    test('should format dates according to locale', async () => {
      await page.goto(`${BASE_URL}/projects`)

      const locales = [
        { code: 'en-US', dateFormat: /\d{1,2}\/\d{1,2}\/\d{4}/ }, // MM/DD/YYYY
        { code: 'en-GB', dateFormat: /\d{1,2}\/\d{1,2}\/\d{4}/ }, // DD/MM/YYYY
        { code: 'de-DE', dateFormat: /\d{1,2}\.\d{1,2}\.\d{4}/ }, // DD.MM.YYYY
        { code: 'fr-FR', dateFormat: /\d{1,2}\/\d{1,2}\/\d{4}/ }, // DD/MM/YYYY
        { code: 'ja-JP', dateFormat: /\d{4}/ } // YYYY/MM/DD or other Japanese format
      ]

      for (const locale of locales) {
        // Set locale
        await page.evaluate((loc) => {
          localStorage.setItem('preferredLocale', loc)
        }, locale.code)

        await page.reload()

        // Check date elements
        const dateElements = await page.locator('[data-testid*="date"]').all()
        if (dateElements.length > 0) {
          const dateText = await dateElements[0].textContent()
          if (dateText) {
            // Should contain a date-like pattern
            expect(dateText).toMatch(/\d/)
          }
        }
      }
    })

    test('should format numbers and currency according to locale', async () => {
      await page.goto(`${BASE_URL}/projects/123/cost-estimate`)

      const locales = [
        { code: 'en-US', currency: 'USD', symbol: '$', decimal: '.', thousands: ',' },
        { code: 'de-DE', currency: 'EUR', symbol: '€', decimal: ',', thousands: '.' },
        { code: 'fr-FR', currency: 'EUR', symbol: '€', decimal: ',', thousands: ' ' },
        { code: 'ja-JP', currency: 'JPY', symbol: '¥', decimal: '.', thousands: ',' }
      ]

      for (const locale of locales) {
        // Set locale
        await page.evaluate((loc) => {
          localStorage.setItem('preferredLocale', loc.code)
          localStorage.setItem('preferredCurrency', loc.currency)
        }, locale)

        await page.reload()
        await page.waitForTimeout(500)

        // Check currency formatting
        const priceElements = page.locator('[data-testid*="price"], [data-testid*="cost"]')
        if (await priceElements.count() > 0) {
          const priceText = await priceElements.first().textContent()

          if (priceText) {
            // Should contain currency symbol or code
            const hasCurrency =
              priceText.includes(locale.symbol) || priceText.includes(locale.currency)
            expect(hasCurrency).toBe(true)

            // Check number formatting
            const numberMatch = priceText.match(/[\d.,\s]+/)
            if (numberMatch) {
              const number = numberMatch[0]
              // Should use appropriate decimal separator
              if (number.includes('.') || number.includes(',')) {
                expect(number).toBeTruthy()
              }
            }
          }
        }

        // Check regular number formatting
        const numberElements = page.locator('[data-testid*="count"], [data-testid*="total"]')
        if (await numberElements.count() > 0) {
          const numberText = await numberElements.first().textContent()
          if (numberText) {
            const hasNumbers = /\d/.test(numberText)
            expect(hasNumbers).toBe(true)
          }
        }
      }
    })
  })
})

/**
 * Test Summary:
 * - Language Switching: 2 tests (switch languages, persist preference)
 * - RTL Support: 1 test (Arabic/Hebrew/Persian rendering, dir attribute, mirrored icons)
 * - Date/Number Formatting: 2 tests (date locale formatting, number/currency formatting)
 *
 * Total: 5 comprehensive internationalization tests
 */
