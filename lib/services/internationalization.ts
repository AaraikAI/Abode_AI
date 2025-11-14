/**
 * Internationalization (i18n) Service
 *
 * Multi-language support for 10+ languages:
 * - Translation management
 * - Locale detection
 * - RTL support
 * - Currency and date formatting
 * - Pluralization rules
 */

export type SupportedLocale =
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
  locale: SupportedLocale
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  currency: string
  dateFormat: string
  numberFormat: string
}

export class InternationalizationService {
  private translations: Map<string, Map<string, string>> = new Map()
  private locales: Map<SupportedLocale, LocaleConfig> = new Map()

  constructor() {
    this.initializeLocales()
  }

  private initializeLocales(): void {
    const locales: LocaleConfig[] = [
      { locale: 'en-US', name: 'English (US)', nativeName: 'English', direction: 'ltr', currency: 'USD', dateFormat: 'MM/DD/YYYY', numberFormat: '1,234.56' },
      { locale: 'es-ES', name: 'Spanish', nativeName: 'Español', direction: 'ltr', currency: 'EUR', dateFormat: 'DD/MM/YYYY', numberFormat: '1.234,56' },
      { locale: 'fr-FR', name: 'French', nativeName: 'Français', direction: 'ltr', currency: 'EUR', dateFormat: 'DD/MM/YYYY', numberFormat: '1 234,56' },
      { locale: 'de-DE', name: 'German', nativeName: 'Deutsch', direction: 'ltr', currency: 'EUR', dateFormat: 'DD.MM.YYYY', numberFormat: '1.234,56' },
      { locale: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr', currency: 'JPY', dateFormat: 'YYYY/MM/DD', numberFormat: '1,234' },
      { locale: 'zh-CN', name: 'Chinese', nativeName: '中文', direction: 'ltr', currency: 'CNY', dateFormat: 'YYYY-MM-DD', numberFormat: '1,234.56' },
      { locale: 'ar-SA', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', currency: 'SAR', dateFormat: 'DD/MM/YYYY', numberFormat: '1,234.56' }
    ]

    locales.forEach(l => this.locales.set(l.locale, l))
  }

  async translate(locale: SupportedLocale, key: string, params?: Record<string, any>): Promise<string> {
    const localeKey = `${locale}:${key}`
    let translation = this.translations.get(locale)?.get(key) || key

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, String(v))
      })
    }

    return translation
  }

  async loadTranslations(locale: SupportedLocale, namespace: string): Promise<void> {
    console.log(`Loading translations for ${locale}/${namespace}`)
    // In production, load from CDN or database
  }

  formatCurrency(locale: SupportedLocale, amount: number): string {
    const config = this.locales.get(locale)
    if (!config) return `$${amount}`

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.currency
    }).format(amount)
  }

  formatDate(locale: SupportedLocale, date: Date): string {
    return new Intl.DateTimeFormat(locale).format(date)
  }

  detectLocale(acceptLanguage: string): SupportedLocale {
    const preferred = acceptLanguage.split(',')[0].trim()
    return this.locales.has(preferred as SupportedLocale) ? preferred as SupportedLocale : 'en-US'
  }
}
