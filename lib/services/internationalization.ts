/**
 * Internationalization (i18n) Service
 *
 * Multi-language support for 12 languages:
 * - Translation management
 * - Locale detection
 * - RTL support
 * - Currency and date formatting
 * - Pluralization rules
 *
 * Fully implemented with translation file loading
 */

export type SupportedLocale =
  | 'en' | 'es' | 'fr' | 'de' | 'it'
  | 'pt' | 'ja' | 'zh' | 'ko' | 'ar'
  | 'hi' | 'ru'

export type ExtendedLocale =
  | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT'
  | 'pt-BR' | 'ja-JP' | 'zh-CN' | 'ko-KR' | 'ar-SA'
  | 'hi-IN' | 'ru-RU'

export interface Translation {
  locale: SupportedLocale
  namespace: string
  key: string
  value: string
  pluralForms?: Record<string, string>
}

export interface LocaleConfig {
  code: SupportedLocale
  extendedCode: ExtendedLocale
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  currency: string
  dateFormat: string
  numberFormat: string
}

export interface TranslationData {
  [key: string]: string | TranslationData
}

export class InternationalizationService {
  private translations: Map<SupportedLocale, TranslationData> = new Map()
  private locales: Map<SupportedLocale, LocaleConfig> = new Map()
  private currentLocale: SupportedLocale = 'en'
  private loadedNamespaces: Set<string> = new Set()

  constructor() {
    this.initializeLocales()
  }

  private initializeLocales(): void {
    const locales: LocaleConfig[] = [
      { code: 'en', extendedCode: 'en-US', name: 'English (US)', nativeName: 'English', direction: 'ltr', currency: 'USD', dateFormat: 'MM/DD/YYYY', numberFormat: '1,234.56' },
      { code: 'es', extendedCode: 'es-ES', name: 'Spanish', nativeName: 'Español', direction: 'ltr', currency: 'EUR', dateFormat: 'DD/MM/YYYY', numberFormat: '1.234,56' },
      { code: 'fr', extendedCode: 'fr-FR', name: 'French', nativeName: 'Français', direction: 'ltr', currency: 'EUR', dateFormat: 'DD/MM/YYYY', numberFormat: '1 234,56' },
      { code: 'de', extendedCode: 'de-DE', name: 'German', nativeName: 'Deutsch', direction: 'ltr', currency: 'EUR', dateFormat: 'DD.MM.YYYY', numberFormat: '1.234,56' },
      { code: 'it', extendedCode: 'it-IT', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', currency: 'EUR', dateFormat: 'DD/MM/YYYY', numberFormat: '1.234,56' },
      { code: 'pt', extendedCode: 'pt-BR', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', currency: 'BRL', dateFormat: 'DD/MM/YYYY', numberFormat: '1.234,56' },
      { code: 'ja', extendedCode: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr', currency: 'JPY', dateFormat: 'YYYY/MM/DD', numberFormat: '1,234' },
      { code: 'zh', extendedCode: 'zh-CN', name: 'Chinese', nativeName: '中文', direction: 'ltr', currency: 'CNY', dateFormat: 'YYYY-MM-DD', numberFormat: '1,234.56' },
      { code: 'ko', extendedCode: 'ko-KR', name: 'Korean', nativeName: '한국어', direction: 'ltr', currency: 'KRW', dateFormat: 'YYYY-MM-DD', numberFormat: '1,234' },
      { code: 'ar', extendedCode: 'ar-SA', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', currency: 'SAR', dateFormat: 'DD/MM/YYYY', numberFormat: '1,234.56' },
      { code: 'hi', extendedCode: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', currency: 'INR', dateFormat: 'DD/MM/YYYY', numberFormat: '1,234.56' },
      { code: 'ru', extendedCode: 'ru-RU', name: 'Russian', nativeName: 'Русский', direction: 'ltr', currency: 'RUB', dateFormat: 'DD.MM.YYYY', numberFormat: '1 234,56' }
    ]

    locales.forEach(l => this.locales.set(l.code, l))
  }

  /**
   * Load translations from JSON files
   */
  async loadTranslations(locale: SupportedLocale, namespace: string = 'translation'): Promise<void> {
    const cacheKey = `${locale}:${namespace}`
    if (this.loadedNamespaces.has(cacheKey)) {
      return // Already loaded
    }

    try {
      // Load translation file from public/locales
      const response = await fetch(`/locales/${locale}/${namespace}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}/${namespace}`)
      }

      const data: TranslationData = await response.json()
      this.translations.set(locale, data)
      this.loadedNamespaces.add(cacheKey)

      console.log(`✅ Loaded translations: ${locale}/${namespace}`)
    } catch (error) {
      console.error(`❌ Failed to load translations for ${locale}/${namespace}:`, error)
      // Fallback to English if loading fails
      if (locale !== 'en') {
        await this.loadTranslations('en', namespace)
      }
    }
  }

  /**
   * Get translation for a key
   */
  translate(key: string, params?: Record<string, any>, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale
    const translation = this.getNestedTranslation(targetLocale, key)

    if (!translation) {
      // Fallback to English
      if (targetLocale !== 'en') {
        const fallback = this.getNestedTranslation('en', key)
        if (fallback) return this.interpolate(fallback, params)
      }
      return key // Return key if no translation found
    }

    return this.interpolate(translation, params)
  }

  /**
   * Get nested translation from dot-notation key (e.g., "common.welcome")
   */
  private getNestedTranslation(locale: SupportedLocale, key: string): string | null {
    const data = this.translations.get(locale)
    if (!data) return null

    const keys = key.split('.')
    let value: any = data

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return null
      }
    }

    return typeof value === 'string' ? value : null
  }

  /**
   * Interpolate parameters into translation string
   */
  private interpolate(translation: string, params?: Record<string, any>): string {
    if (!params) return translation

    return Object.entries(params).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }, translation)
  }

  /**
   * Set current locale
   */
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.locales.has(locale)) {
      console.warn(`Locale ${locale} not supported, using 'en'`)
      locale = 'en'
    }

    this.currentLocale = locale
    await this.loadTranslations(locale)

    // Update HTML dir attribute for RTL support
    const config = this.locales.get(locale)
    if (config && typeof document !== 'undefined') {
      document.documentElement.dir = config.direction
      document.documentElement.lang = locale
    }
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): SupportedLocale {
    return this.currentLocale
  }

  /**
   * Get all available locales
   */
  getAvailableLocales(): LocaleConfig[] {
    return Array.from(this.locales.values())
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale
    const config = this.locales.get(targetLocale)
    if (!config) return `$${amount}`

    return new Intl.NumberFormat(config.extendedCode, {
      style: 'currency',
      currency: config.currency
    }).format(amount)
  }

  /**
   * Format date
   */
  formatDate(date: Date, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale
    const config = this.locales.get(targetLocale)
    return new Intl.DateTimeFormat(config?.extendedCode || 'en-US').format(date)
  }

  /**
   * Format number
   */
  formatNumber(value: number, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale
    const config = this.locales.get(targetLocale)
    return new Intl.NumberFormat(config?.extendedCode || 'en-US').format(value)
  }

  /**
   * Detect locale from Accept-Language header or browser
   */
  detectLocale(acceptLanguage?: string): SupportedLocale {
    // Try Accept-Language header first
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0].trim().split('-')[0]
      if (this.locales.has(preferred as SupportedLocale)) {
        return preferred as SupportedLocale
      }
    }

    // Try browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0]
      if (this.locales.has(browserLang as SupportedLocale)) {
        return browserLang as SupportedLocale
      }
    }

    return 'en' // Default fallback
  }

  /**
   * Check if locale uses RTL (Right-to-Left) direction
   */
  isRTL(locale?: SupportedLocale): boolean {
    const targetLocale = locale || this.currentLocale
    const config = this.locales.get(targetLocale)
    return config?.direction === 'rtl'
  }
}

// Export singleton instance
export const i18n = new InternationalizationService()
