'use client'

import { useState, useEffect } from 'react'
import { i18n, type SupportedLocale, type LocaleConfig } from '@/lib/services/internationalization'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en')
  const [locales, setLocales] = useState<LocaleConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize i18n and load current locale
    const initializeI18n = async () => {
      const detected = i18n.detectLocale()
      await i18n.setLocale(detected)
      setCurrentLocale(i18n.getCurrentLocale())
      setLocales(i18n.getAvailableLocales())
    }

    initializeI18n()
  }, [])

  const handleLocaleChange = async (locale: SupportedLocale) => {
    setIsLoading(true)
    try {
      await i18n.setLocale(locale)
      setCurrentLocale(locale)

      // Store preference in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLocale', locale)
      }

      // Reload page to apply new language globally
      window.location.reload()
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentLocale}
        onValueChange={handleLocaleChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              <div className="flex items-center justify-between w-full">
                <span>{locale.nativeName}</span>
                {locale.direction === 'rtl' && (
                  <span className="text-xs text-muted-foreground ml-2">RTL</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Hook for using translations in components
export function useTranslation() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en')

  useEffect(() => {
    setCurrentLocale(i18n.getCurrentLocale())
  }, [])

  const t = (key: string, params?: Record<string, any>) => {
    return i18n.translate(key, params)
  }

  const formatCurrency = (amount: number) => {
    return i18n.formatCurrency(amount)
  }

  const formatDate = (date: Date) => {
    return i18n.formatDate(date)
  }

  const formatNumber = (value: number) => {
    return i18n.formatNumber(value)
  }

  return {
    t,
    currentLocale,
    formatCurrency,
    formatDate,
    formatNumber,
    isRTL: i18n.isRTL()
  }
}
