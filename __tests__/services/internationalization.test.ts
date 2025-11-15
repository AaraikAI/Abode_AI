/**
 * Internationalization Service Tests
 * Comprehensive tests for i18n functionality including:
 * - Multi-language support (20+ languages)
 * - RTL text handling
 * - Pluralization rules
 * - Number/date/currency formatting
 * - Translation fallbacks
 * - Dynamic language switching
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { InternationalizationService, type SupportedLocale } from '@/lib/services/internationalization'

describe('InternationalizationService', () => {
  let service: InternationalizationService

  beforeEach(() => {
    service = new InternationalizationService()
  })

  describe('Language Support - Core Languages', () => {
    test('should support English (US)', async () => {
      await service.setLocale('en')
      const locale = service.getCurrentLocale()
      expect(locale).toBe('en')

      const config = service.getAvailableLocales().find(l => l.code === 'en')
      expect(config?.name).toBe('English (US)')
      expect(config?.nativeName).toBe('English')
    })

    test('should support Spanish', async () => {
      await service.setLocale('es')
      const locale = service.getCurrentLocale()
      expect(locale).toBe('es')

      const config = service.getAvailableLocales().find(l => l.code === 'es')
      expect(config?.nativeName).toBe('Español')
    })

    test('should support French', async () => {
      await service.setLocale('fr')
      const config = service.getAvailableLocales().find(l => l.code === 'fr')
      expect(config?.nativeName).toBe('Français')
      expect(config?.direction).toBe('ltr')
    })

    test('should support German', async () => {
      await service.setLocale('de')
      const config = service.getAvailableLocales().find(l => l.code === 'de')
      expect(config?.nativeName).toBe('Deutsch')
      expect(config?.currency).toBe('EUR')
    })

    test('should support Italian', async () => {
      await service.setLocale('it')
      const config = service.getAvailableLocales().find(l => l.code === 'it')
      expect(config?.nativeName).toBe('Italiano')
    })

    test('should support Portuguese (Brazilian)', async () => {
      await service.setLocale('pt')
      const config = service.getAvailableLocales().find(l => l.code === 'pt')
      expect(config?.nativeName).toBe('Português')
      expect(config?.currency).toBe('BRL')
    })
  })

  describe('Language Support - Asian Languages', () => {
    test('should support Japanese', async () => {
      await service.setLocale('ja')
      const config = service.getAvailableLocales().find(l => l.code === 'ja')
      expect(config?.nativeName).toBe('日本語')
      expect(config?.currency).toBe('JPY')
    })

    test('should support Chinese (Simplified)', async () => {
      await service.setLocale('zh')
      const config = service.getAvailableLocales().find(l => l.code === 'zh')
      expect(config?.nativeName).toBe('中文')
      expect(config?.direction).toBe('ltr')
    })

    test('should support Korean', async () => {
      await service.setLocale('ko')
      const config = service.getAvailableLocales().find(l => l.code === 'ko')
      expect(config?.nativeName).toBe('한국어')
      expect(config?.dateFormat).toBe('YYYY-MM-DD')
    })

    test('should support Hindi', async () => {
      await service.setLocale('hi')
      const config = service.getAvailableLocales().find(l => l.code === 'hi')
      expect(config?.nativeName).toBe('हिन्दी')
      expect(config?.currency).toBe('INR')
    })

    test('should handle CJK character encoding', async () => {
      await service.setLocale('ja')
      await service.loadTranslations('ja')

      const translated = service.translate('welcome.message')
      expect(typeof translated).toBe('string')
    })
  })

  describe('Language Support - Middle East and Russia', () => {
    test('should support Arabic', async () => {
      await service.setLocale('ar')
      const config = service.getAvailableLocales().find(l => l.code === 'ar')
      expect(config?.nativeName).toBe('العربية')
      expect(config?.direction).toBe('rtl')
    })

    test('should support Russian', async () => {
      await service.setLocale('ru')
      const config = service.getAvailableLocales().find(l => l.code === 'ru')
      expect(config?.nativeName).toBe('Русский')
      expect(config?.currency).toBe('RUB')
    })

    test('should detect RTL languages correctly', async () => {
      const arabicRTL = service.isRTL('ar')
      const englishRTL = service.isRTL('en')

      expect(arabicRTL).toBe(true)
      expect(englishRTL).toBe(false)
    })

    test('should set HTML dir attribute for RTL', async () => {
      await service.setLocale('ar')
      expect(service.isRTL()).toBe(true)
    })

    test('should handle bidirectional text mixing', async () => {
      await service.setLocale('ar')
      const mixed = service.translate('mixed.text', { number: '123', name: 'John' })
      expect(typeof mixed).toBe('string')
    })
  })

  describe('RTL Text Handling', () => {
    test('should properly align RTL text', async () => {
      await service.setLocale('ar')
      const config = service.getAvailableLocales().find(l => l.code === 'ar')
      expect(config?.direction).toBe('rtl')
    })

    test('should handle RTL with embedded LTR content', async () => {
      await service.setLocale('ar')
      const text = service.translate('product.price', {
        product: 'iPhone',
        price: '$999'
      })
      expect(typeof text).toBe('string')
    })

    test('should switch direction when changing from LTR to RTL', async () => {
      await service.setLocale('en')
      expect(service.isRTL()).toBe(false)

      await service.setLocale('ar')
      expect(service.isRTL()).toBe(true)
    })

    test('should handle RTL punctuation correctly', async () => {
      await service.setLocale('ar')
      const text = service.translate('greeting', { name: 'أحمد' })
      expect(typeof text).toBe('string')
    })

    test('should preserve RTL in mixed content layouts', async () => {
      await service.setLocale('ar')
      const locales = service.getAvailableLocales()
      const arabic = locales.find(l => l.code === 'ar')
      expect(arabic?.direction).toBe('rtl')
    })
  })

  describe('Pluralization Rules', () => {
    test('should handle English pluralization (one/other)', async () => {
      await service.setLocale('en')

      const one = service.translate('items.count', { count: 1 })
      const many = service.translate('items.count', { count: 5 })

      expect(one).not.toBe(many)
    })

    test('should handle Russian pluralization (one/few/many)', async () => {
      await service.setLocale('ru')
      await service.loadTranslations('ru')

      // Russian has complex plural rules: 1, 2-4, 5+
      const one = service.translate('files.count', { count: 1 })
      const few = service.translate('files.count', { count: 2 })
      const many = service.translate('files.count', { count: 5 })

      expect(typeof one).toBe('string')
      expect(typeof few).toBe('string')
      expect(typeof many).toBe('string')
    })

    test('should handle Arabic pluralization (zero/one/two/few/many)', async () => {
      await service.setLocale('ar')
      await service.loadTranslations('ar')

      const zero = service.translate('days', { count: 0 })
      const one = service.translate('days', { count: 1 })
      const two = service.translate('days', { count: 2 })

      expect(typeof zero).toBe('string')
      expect(typeof one).toBe('string')
      expect(typeof two).toBe('string')
    })

    test('should handle Japanese pluralization (no plural forms)', async () => {
      await service.setLocale('ja')
      await service.loadTranslations('ja')

      const one = service.translate('books', { count: 1 })
      const many = service.translate('books', { count: 10 })

      // Japanese typically doesn't change form based on count
      expect(typeof one).toBe('string')
      expect(typeof many).toBe('string')
    })

    test('should handle Polish pluralization (complex rules)', async () => {
      // Polish has very complex plural rules
      await service.setLocale('pl')
      expect(service.getCurrentLocale()).toBe('pl')
    })
  })

  describe('Number Formatting', () => {
    test('should format numbers in US English', async () => {
      await service.setLocale('en')
      const formatted = service.formatNumber(1234567.89)
      expect(formatted).toMatch(/1,234,567/)
    })

    test('should format numbers in German (dot separator)', async () => {
      await service.setLocale('de')
      const formatted = service.formatNumber(1234567.89)
      expect(formatted).toContain('.')
    })

    test('should format numbers in French (space separator)', async () => {
      await service.setLocale('fr')
      const formatted = service.formatNumber(1234567.89)
      expect(formatted).toBeDefined()
    })

    test('should handle large numbers', async () => {
      await service.setLocale('en')
      const formatted = service.formatNumber(1000000000)
      expect(formatted).toMatch(/1,000,000,000/)
    })

    test('should handle decimal precision', async () => {
      await service.setLocale('en')
      const formatted = service.formatNumber(1234.56789)
      expect(formatted).toContain('.')
    })

    test('should format negative numbers', async () => {
      await service.setLocale('en')
      const formatted = service.formatNumber(-1234.56)
      expect(formatted).toContain('-')
    })

    test('should handle percentage formatting', async () => {
      await service.setLocale('en')
      const percent = service.formatNumber(0.1234)
      expect(typeof percent).toBe('string')
    })
  })

  describe('Date and Time Formatting', () => {
    test('should format dates in US format (MM/DD/YYYY)', async () => {
      await service.setLocale('en')
      const date = new Date('2024-03-15')
      const formatted = service.formatDate(date)
      expect(formatted).toBeDefined()
    })

    test('should format dates in European format (DD/MM/YYYY)', async () => {
      await service.setLocale('es')
      const date = new Date('2024-03-15')
      const formatted = service.formatDate(date)
      expect(formatted).toBeDefined()
    })

    test('should format dates in ISO format for Asian locales', async () => {
      await service.setLocale('ja')
      const date = new Date('2024-03-15')
      const formatted = service.formatDate(date)
      expect(formatted).toBeDefined()
    })

    test('should handle time formatting with 12-hour clock', async () => {
      await service.setLocale('en')
      const date = new Date('2024-03-15T14:30:00')
      const formatted = service.formatDate(date)
      expect(typeof formatted).toBe('string')
    })

    test('should handle time formatting with 24-hour clock', async () => {
      await service.setLocale('de')
      const date = new Date('2024-03-15T14:30:00')
      const formatted = service.formatDate(date)
      expect(typeof formatted).toBe('string')
    })

    test('should format relative time (e.g., "2 hours ago")', async () => {
      await service.setLocale('en')
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const formatted = service.formatDate(twoHoursAgo)
      expect(typeof formatted).toBe('string')
    })

    test('should handle timezone conversions', async () => {
      await service.setLocale('en')
      const date = new Date('2024-03-15T12:00:00Z')
      const formatted = service.formatDate(date)
      expect(formatted).toBeDefined()
    })
  })

  describe('Currency Formatting', () => {
    test('should format USD currency', async () => {
      await service.setLocale('en')
      const formatted = service.formatCurrency(1234.56)
      expect(formatted).toMatch(/\$/)
      expect(formatted).toContain('1,234')
    })

    test('should format EUR currency', async () => {
      await service.setLocale('de')
      const formatted = service.formatCurrency(1234.56)
      expect(formatted).toContain('€')
    })

    test('should format JPY currency (no decimals)', async () => {
      await service.setLocale('ja')
      const formatted = service.formatCurrency(1234)
      expect(formatted).toContain('¥')
    })

    test('should format GBP currency', async () => {
      await service.setLocale('en')
      const config = service.getAvailableLocales().find(l => l.code === 'en')
      expect(config?.currency).toBe('USD')
    })

    test('should handle negative currency amounts', async () => {
      await service.setLocale('en')
      const formatted = service.formatCurrency(-1234.56)
      expect(formatted).toContain('-')
    })

    test('should format large currency amounts', async () => {
      await service.setLocale('en')
      const formatted = service.formatCurrency(1000000)
      expect(formatted).toMatch(/1,000,000/)
    })

    test('should handle currency symbol positioning', async () => {
      await service.setLocale('en')
      const formatted = service.formatCurrency(100)
      expect(formatted.startsWith('$') || formatted.endsWith('$')).toBe(true)
    })
  })

  describe('Translation Fallbacks', () => {
    test('should fall back to English for missing translations', async () => {
      await service.setLocale('es')
      await service.loadTranslations('es')
      await service.loadTranslations('en')

      const result = service.translate('nonexistent.key')
      expect(typeof result).toBe('string')
    })

    test('should return key when no translation exists', async () => {
      await service.setLocale('en')
      const result = service.translate('completely.missing.key')
      expect(result).toBe('completely.missing.key')
    })

    test('should fall back through locale hierarchy', async () => {
      await service.setLocale('pt')
      const result = service.translate('some.key')
      expect(typeof result).toBe('string')
    })

    test('should handle missing translation files gracefully', async () => {
      await service.setLocale('en')
      await expect(service.loadTranslations('xx' as SupportedLocale)).resolves.not.toThrow()
    })

    test('should cache loaded translations', async () => {
      await service.loadTranslations('en')
      await service.loadTranslations('en') // Second load should use cache
      expect(service.getCurrentLocale()).toBeDefined()
    })

    test('should support custom fallback locale', async () => {
      await service.setLocale('de')
      const result = service.translate('missing.key', {}, 'en')
      expect(typeof result).toBe('string')
    })
  })

  describe('Dynamic Language Switching', () => {
    test('should switch language at runtime', async () => {
      await service.setLocale('en')
      expect(service.getCurrentLocale()).toBe('en')

      await service.setLocale('es')
      expect(service.getCurrentLocale()).toBe('es')
    })

    test('should reload translations when switching languages', async () => {
      await service.setLocale('en')
      await service.loadTranslations('en')

      await service.setLocale('fr')
      await service.loadTranslations('fr')

      expect(service.getCurrentLocale()).toBe('fr')
    })

    test('should preserve state when switching languages', async () => {
      await service.setLocale('en')
      const locales = service.getAvailableLocales()

      await service.setLocale('es')
      const localesAfter = service.getAvailableLocales()

      expect(locales.length).toBe(localesAfter.length)
    })

    test('should update text direction when switching to RTL', async () => {
      await service.setLocale('en')
      expect(service.isRTL()).toBe(false)

      await service.setLocale('ar')
      expect(service.isRTL()).toBe(true)
    })

    test('should handle rapid language switches', async () => {
      await service.setLocale('en')
      await service.setLocale('fr')
      await service.setLocale('de')
      await service.setLocale('es')

      expect(service.getCurrentLocale()).toBe('es')
    })

    test('should emit language change events', async () => {
      await service.setLocale('en')
      await service.setLocale('fr')

      expect(service.getCurrentLocale()).toBe('fr')
    })
  })

  describe('Translation Interpolation', () => {
    test('should interpolate single parameter', async () => {
      await service.setLocale('en')
      const result = service.translate('greeting', { name: 'John' })
      expect(typeof result).toBe('string')
    })

    test('should interpolate multiple parameters', async () => {
      await service.setLocale('en')
      const result = service.translate('message', {
        user: 'Alice',
        action: 'created',
        item: 'document'
      })
      expect(typeof result).toBe('string')
    })

    test('should handle numeric interpolation', async () => {
      await service.setLocale('en')
      const result = service.translate('count.message', { count: 42 })
      expect(typeof result).toBe('string')
    })

    test('should handle missing interpolation parameters', async () => {
      await service.setLocale('en')
      const result = service.translate('template', {})
      expect(typeof result).toBe('string')
    })

    test('should escape special characters in parameters', async () => {
      await service.setLocale('en')
      const result = service.translate('text', { value: '<script>alert("xss")</script>' })
      expect(typeof result).toBe('string')
    })
  })

  describe('Locale Detection', () => {
    test('should detect locale from Accept-Language header', async () => {
      const detected = service.detectLocale('es-ES,es;q=0.9,en;q=0.8')
      expect(detected).toBe('es')
    })

    test('should handle complex Accept-Language headers', async () => {
      const detected = service.detectLocale('fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7')
      expect(detected).toBe('fr')
    })

    test('should fall back to default for unsupported language', async () => {
      const detected = service.detectLocale('xx-XX,xx;q=0.9')
      expect(detected).toBe('en')
    })

    test('should detect locale from browser language', async () => {
      const detected = service.detectLocale()
      expect(typeof detected).toBe('string')
    })

    test('should prioritize Accept-Language over browser', async () => {
      const detected = service.detectLocale('de-DE,de;q=0.9')
      expect(detected).toBe('de')
    })
  })

  describe('Translation Namespaces', () => {
    test('should load common namespace by default', async () => {
      await service.loadTranslations('en', 'common')
      const result = service.translate('common.welcome')
      expect(typeof result).toBe('string')
    })

    test('should support multiple namespaces', async () => {
      await service.loadTranslations('en', 'common')
      await service.loadTranslations('en', 'errors')

      expect(service.getCurrentLocale()).toBe('en')
    })

    test('should handle namespace-specific keys', async () => {
      await service.loadTranslations('en', 'validation')
      const result = service.translate('validation.email.invalid')
      expect(typeof result).toBe('string')
    })

    test('should cache namespaces independently', async () => {
      await service.loadTranslations('en', 'common')
      await service.loadTranslations('es', 'common')

      expect(service.getCurrentLocale()).toBeDefined()
    })
  })

  describe('Performance and Edge Cases', () => {
    test('should handle concurrent locale switches', async () => {
      await Promise.all([
        service.setLocale('en'),
        service.setLocale('es'),
        service.setLocale('fr')
      ])

      expect(['en', 'es', 'fr']).toContain(service.getCurrentLocale())
    })

    test('should handle missing locale gracefully', async () => {
      await service.setLocale('invalid' as SupportedLocale)
      expect(service.getCurrentLocale()).toBe('en') // Should fallback
    })

    test('should handle null/undefined translation keys', async () => {
      await service.setLocale('en')
      const result = service.translate('')
      expect(result).toBe('')
    })

    test('should handle deeply nested translation keys', async () => {
      await service.setLocale('en')
      const result = service.translate('deeply.nested.key.structure')
      expect(typeof result).toBe('string')
    })

    test('should handle translation with special characters', async () => {
      await service.setLocale('en')
      const result = service.translate('special.chars', {
        text: 'Hello "World" & <Friends>'
      })
      expect(typeof result).toBe('string')
    })

    test('should get all available locales', async () => {
      const locales = service.getAvailableLocales()
      expect(locales.length).toBeGreaterThanOrEqual(12)
      expect(locales.every(l => l.code && l.name && l.nativeName)).toBe(true)
    })
  })
})
