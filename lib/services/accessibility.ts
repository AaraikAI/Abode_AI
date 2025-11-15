/**
 * WCAG AA Compliance Service
 *
 * Comprehensive accessibility service ensuring WCAG 2.1 AA compliance
 * including color contrast, screen reader support, keyboard navigation,
 * and automated accessibility testing.
 */

export interface ColorContrastResult {
  ratio: number
  passes: {
    aa: boolean
    aaLarge: boolean
    aaa: boolean
    aaaLarge: boolean
  }
  foreground: string
  background: string
}

export interface AccessibilityAuditResult {
  violations: AccessibilityViolation[]
  warnings: AccessibilityWarning[]
  passes: number
  score: number
  timestamp: Date
}

export interface AccessibilityViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    target: string[]
    html: string
    failureSummary: string
  }>
}

export interface AccessibilityWarning {
  id: string
  description: string
  help: string
  nodes: Array<{
    target: string[]
    html: string
  }>
}

export interface KeyboardNavigationConfig {
  trapFocus?: boolean
  returnFocus?: boolean
  escapeDeactivates?: boolean
  initialFocus?: HTMLElement | string
}

export interface ScreenReaderAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  clearPrevious?: boolean
}

export interface ARIAAttributes {
  role?: string
  label?: string
  labelledby?: string
  describedby?: string
  expanded?: boolean
  pressed?: boolean
  selected?: boolean
  checked?: boolean | 'mixed'
  disabled?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: string
  busy?: boolean
}

export class AccessibilityService {
  private liveRegion: HTMLElement | null = null
  private focusTrapStack: HTMLElement[] = []

  /**
   * Initialize accessibility service
   */
  constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion()
      this.setupGlobalKeyboardHandlers()
      this.setupFocusVisiblePolyfill()
    }
  }

  /**
   * Check color contrast ratio between foreground and background
   * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
   */
  checkColorContrast(foreground: string, background: string): ColorContrastResult {
    const fgLuminance = this.getRelativeLuminance(foreground)
    const bgLuminance = this.getRelativeLuminance(background)

    const ratio = this.calculateContrastRatio(fgLuminance, bgLuminance)

    return {
      ratio,
      passes: {
        aa: ratio >= 4.5,
        aaLarge: ratio >= 3.0,
        aaa: ratio >= 7.0,
        aaaLarge: ratio >= 4.5
      },
      foreground,
      background
    }
  }

  /**
   * Get relative luminance for a color
   * https://www.w3.org/TR/WCAG20-TECHS/G17.html
   */
  private getRelativeLuminance(color: string): number {
    const rgb = this.parseColor(color)
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  /**
   * Calculate contrast ratio between two luminance values
   */
  private calculateContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Parse color string to RGB values
   */
  private parseColor(color: string): [number, number, number] {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1)
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return [r, g, b]
    }

    // Handle rgb/rgba colors
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }

    // Default to black
    return [0, 0, 0]
  }

  /**
   * Perform comprehensive accessibility audit on a page or element
   */
  async auditAccessibility(
    context: Document | HTMLElement = document
  ): Promise<AccessibilityAuditResult> {
    const violations: AccessibilityViolation[] = []
    const warnings: AccessibilityWarning[] = []
    let passes = 0

    // Check for images without alt text
    const images = context.querySelectorAll('img')
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt')
      if (alt === null) {
        violations.push({
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help: 'All img elements must have an alt attribute',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
          nodes: [{
            target: [`img:nth-of-type(${index + 1})`],
            html: img.outerHTML.substring(0, 100),
            failureSummary: 'Missing alt attribute'
          }]
        })
      } else if (alt.trim() === '' && img.getAttribute('role') !== 'presentation') {
        warnings.push({
          id: 'image-alt-empty',
          description: 'Image has empty alt text but no presentation role',
          help: 'Decorative images should have role="presentation" or alt=""',
          nodes: [{
            target: [`img:nth-of-type(${index + 1})`],
            html: img.outerHTML.substring(0, 100)
          }]
        })
      } else {
        passes++
      }
    })

    // Check for form inputs without labels
    const inputs = context.querySelectorAll('input, select, textarea')
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id')
      const ariaLabel = input.getAttribute('aria-label')
      const ariaLabelledby = input.getAttribute('aria-labelledby')

      let hasLabel = false
      if (id) {
        const label = context.querySelector(`label[for="${id}"]`)
        if (label) hasLabel = true
      }

      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        violations.push({
          id: 'form-field-label',
          impact: 'critical',
          description: 'Form fields must have labels',
          help: 'All form fields should have an associated label or aria-label',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
          nodes: [{
            target: [`${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`],
            html: input.outerHTML.substring(0, 100),
            failureSummary: 'No associated label found'
          }]
        })
      } else {
        passes++
      }
    })

    // Check for buttons without accessible names
    const buttons = context.querySelectorAll('button')
    buttons.forEach((button, index) => {
      const text = button.textContent?.trim()
      const ariaLabel = button.getAttribute('aria-label')
      const ariaLabelledby = button.getAttribute('aria-labelledby')

      if (!text && !ariaLabel && !ariaLabelledby) {
        violations.push({
          id: 'button-name',
          impact: 'serious',
          description: 'Buttons must have discernible text',
          help: 'Buttons should have text content or aria-label',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
          nodes: [{
            target: [`button:nth-of-type(${index + 1})`],
            html: button.outerHTML.substring(0, 100),
            failureSummary: 'Button has no accessible name'
          }]
        })
      } else {
        passes++
      }
    })

    // Check for proper heading hierarchy
    const headings = Array.from(context.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    let previousLevel = 0
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))

      if (level - previousLevel > 1) {
        violations.push({
          id: 'heading-order',
          impact: 'moderate',
          description: 'Heading levels should only increase by one',
          help: 'Ensure headings follow a logical hierarchy',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
          nodes: [{
            target: [`${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`],
            html: heading.outerHTML.substring(0, 100),
            failureSummary: `Jumped from h${previousLevel} to h${level}`
          }]
        })
      } else {
        passes++
      }

      previousLevel = level
    })

    // Check for links without href
    const links = context.querySelectorAll('a')
    links.forEach((link, index) => {
      const href = link.getAttribute('href')
      if (!href || href === '#') {
        violations.push({
          id: 'link-name',
          impact: 'serious',
          description: 'Links must have a valid href attribute',
          help: 'Links should navigate to a valid destination',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
          nodes: [{
            target: [`a:nth-of-type(${index + 1})`],
            html: link.outerHTML.substring(0, 100),
            failureSummary: 'Link has no or empty href'
          }]
        })
      } else {
        passes++
      }
    })

    // Check for color contrast on text elements
    const textElements = context.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label')
    textElements.forEach((element) => {
      if (element.textContent?.trim()) {
        const style = window.getComputedStyle(element)
        const color = style.color
        const backgroundColor = style.backgroundColor

        if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = this.checkColorContrast(color, backgroundColor)
          const fontSize = parseFloat(style.fontSize)
          const isLarge = fontSize >= 18 || (fontSize >= 14 && style.fontWeight === 'bold')

          const passesAA = isLarge ? contrast.passes.aaLarge : contrast.passes.aa

          if (!passesAA) {
            violations.push({
              id: 'color-contrast',
              impact: 'serious',
              description: 'Text must have sufficient color contrast',
              help: `Contrast ratio ${contrast.ratio.toFixed(2)}:1 is insufficient (requires ${isLarge ? '3:1' : '4.5:1'})`,
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
              nodes: [{
                target: [element.tagName.toLowerCase()],
                html: element.outerHTML.substring(0, 100),
                failureSummary: `Insufficient contrast: ${contrast.ratio.toFixed(2)}:1`
              }]
            })
          }
        }
      }
    })

    // Check for duplicate IDs
    const ids = new Map<string, number>()
    context.querySelectorAll('[id]').forEach((element) => {
      const id = element.getAttribute('id')
      if (id) {
        ids.set(id, (ids.get(id) || 0) + 1)
      }
    })

    ids.forEach((count, id) => {
      if (count > 1) {
        violations.push({
          id: 'duplicate-id',
          impact: 'critical',
          description: 'IDs must be unique',
          help: `ID "${id}" appears ${count} times`,
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html',
          nodes: [{
            target: [`[id="${id}"]`],
            html: '',
            failureSummary: `Duplicate ID: ${id}`
          }]
        })
      }
    })

    const totalChecks = passes + violations.length
    const score = totalChecks > 0 ? Math.round((passes / totalChecks) * 100) : 100

    return {
      violations,
      warnings,
      passes,
      score,
      timestamp: new Date()
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(announcement: ScreenReaderAnnouncement): void {
    if (!this.liveRegion) return

    if (announcement.clearPrevious) {
      this.liveRegion.textContent = ''
    }

    this.liveRegion.setAttribute('aria-live', announcement.priority)

    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = announcement.message
      }
    }, 100)
  }

  /**
   * Create live region for screen reader announcements
   */
  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('role', 'status')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.className = 'sr-only'
    this.liveRegion.style.position = 'absolute'
    this.liveRegion.style.left = '-10000px'
    this.liveRegion.style.width = '1px'
    this.liveRegion.style.height = '1px'
    this.liveRegion.style.overflow = 'hidden'
    document.body.appendChild(this.liveRegion)
  }

  /**
   * Setup focus trap for modal dialogs
   */
  setupFocusTrap(container: HTMLElement, config: KeyboardNavigationConfig = {}): () => void {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return () => {}

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const previousActiveElement = document.activeElement as HTMLElement

    // Focus initial element
    if (config.initialFocus) {
      const initialEl = typeof config.initialFocus === 'string'
        ? container.querySelector(config.initialFocus) as HTMLElement
        : config.initialFocus
      initialEl?.focus()
    } else {
      firstElement.focus()
    }

    // Trap focus handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        if (e.key === 'Escape' && config.escapeDeactivates !== false) {
          cleanup()
        }
        return
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    this.focusTrapStack.push(container)

    // Cleanup function
    const cleanup = () => {
      container.removeEventListener('keydown', handleKeyDown)
      const index = this.focusTrapStack.indexOf(container)
      if (index > -1) {
        this.focusTrapStack.splice(index, 1)
      }
      if (config.returnFocus !== false) {
        previousActiveElement?.focus()
      }
    }

    return cleanup
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
      .filter((el) => {
        return el instanceof HTMLElement &&
               !el.hasAttribute('disabled') &&
               el.offsetParent !== null
      }) as HTMLElement[]
  }

  /**
   * Set ARIA attributes on an element
   */
  setARIA(element: HTMLElement, attributes: ARIAAttributes): void {
    if (attributes.role !== undefined) {
      element.setAttribute('role', attributes.role)
    }
    if (attributes.label !== undefined) {
      element.setAttribute('aria-label', attributes.label)
    }
    if (attributes.labelledby !== undefined) {
      element.setAttribute('aria-labelledby', attributes.labelledby)
    }
    if (attributes.describedby !== undefined) {
      element.setAttribute('aria-describedby', attributes.describedby)
    }
    if (attributes.expanded !== undefined) {
      element.setAttribute('aria-expanded', String(attributes.expanded))
    }
    if (attributes.pressed !== undefined) {
      element.setAttribute('aria-pressed', String(attributes.pressed))
    }
    if (attributes.selected !== undefined) {
      element.setAttribute('aria-selected', String(attributes.selected))
    }
    if (attributes.checked !== undefined) {
      element.setAttribute('aria-checked', String(attributes.checked))
    }
    if (attributes.disabled !== undefined) {
      element.setAttribute('aria-disabled', String(attributes.disabled))
    }
    if (attributes.hidden !== undefined) {
      element.setAttribute('aria-hidden', String(attributes.hidden))
    }
    if (attributes.live !== undefined) {
      element.setAttribute('aria-live', attributes.live)
    }
    if (attributes.atomic !== undefined) {
      element.setAttribute('aria-atomic', String(attributes.atomic))
    }
    if (attributes.relevant !== undefined) {
      element.setAttribute('aria-relevant', attributes.relevant)
    }
    if (attributes.busy !== undefined) {
      element.setAttribute('aria-busy', String(attributes.busy))
    }
  }

  /**
   * Setup global keyboard handlers for accessibility
   */
  private setupGlobalKeyboardHandlers(): void {
    // Skip to main content
    document.addEventListener('keydown', (e) => {
      if (e.key === '1' && e.altKey) {
        e.preventDefault()
        const main = document.querySelector('main') || document.querySelector('[role="main"]')
        if (main instanceof HTMLElement) {
          main.focus()
          main.scrollIntoView({ behavior: 'smooth' })
        }
      }
    })
  }

  /**
   * Setup focus-visible polyfill for keyboard navigation
   */
  private setupFocusVisiblePolyfill(): void {
    let hadKeyboardEvent = false
    const keyboardThrottleTimeMs = 100
    let keyboardThrottleTimeout: NodeJS.Timeout | null = null

    const handleKeyDown = () => {
      hadKeyboardEvent = true

      if (keyboardThrottleTimeout) {
        clearTimeout(keyboardThrottleTimeout)
      }

      keyboardThrottleTimeout = setTimeout(() => {
        hadKeyboardEvent = false
      }, keyboardThrottleTimeMs)
    }

    const handleFocus = (e: FocusEvent) => {
      if (hadKeyboardEvent && e.target instanceof HTMLElement) {
        e.target.setAttribute('data-focus-visible', 'true')
      }
    }

    const handleBlur = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) {
        e.target.removeAttribute('data-focus-visible')
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('focus', handleFocus, true)
    document.addEventListener('blur', handleBlur, true)
  }

  /**
   * Generate accessibility report
   */
  async generateReport(context?: Document | HTMLElement): Promise<string> {
    const audit = await this.auditAccessibility(context)

    let report = '# Accessibility Audit Report\n\n'
    report += `**Date:** ${audit.timestamp.toISOString()}\n`
    report += `**Score:** ${audit.score}/100\n\n`

    report += `## Summary\n\n`
    report += `- Violations: ${audit.violations.length}\n`
    report += `- Warnings: ${audit.warnings.length}\n`
    report += `- Passes: ${audit.passes}\n\n`

    if (audit.violations.length > 0) {
      report += `## Violations\n\n`
      audit.violations.forEach((violation, index) => {
        report += `### ${index + 1}. ${violation.description}\n`
        report += `**Impact:** ${violation.impact}\n`
        report += `**Help:** ${violation.help}\n`
        report += `**Learn more:** ${violation.helpUrl}\n`
        report += `**Affected nodes:** ${violation.nodes.length}\n\n`
      })
    }

    if (audit.warnings.length > 0) {
      report += `## Warnings\n\n`
      audit.warnings.forEach((warning, index) => {
        report += `### ${index + 1}. ${warning.description}\n`
        report += `**Help:** ${warning.help}\n`
        report += `**Affected nodes:** ${warning.nodes.length}\n\n`
      })
    }

    return report
  }
}

// Singleton export
export const accessibility = new AccessibilityService()
