/**
 * Accessibility Utilities
 *
 * Helper functions for WCAG AA compliance
 */

/**
 * Generate unique ID for accessibility
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReaders(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)

  return !(
    element.hasAttribute('aria-hidden') ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.offsetParent === null
  )
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check aria-labelledby
  const ariaLabelledby = element.getAttribute('aria-labelledby')
  if (ariaLabelledby) {
    const labelElement = document.getElementById(ariaLabelledby)
    if (labelElement) return labelElement.textContent || ''
  }

  // Check associated label
  const id = element.getAttribute('id')
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    if (label) return label.textContent || ''
  }

  // Check text content
  return element.textContent || ''
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'skip-link'
  skipLink.style.position = 'absolute'
  skipLink.style.top = '-40px'
  skipLink.style.left = '0'
  skipLink.style.background = '#000'
  skipLink.style.color = '#fff'
  skipLink.style.padding = '8px'
  skipLink.style.textDecoration = 'none'
  skipLink.style.zIndex = '100'

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0'
  })

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px'
  })

  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return skipLink
}

/**
 * Setup roving tabindex for keyboard navigation
 */
export function setupRovingTabindex(
  container: HTMLElement,
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    wrap?: boolean
  } = {}
): () => void {
  const { orientation = 'both', wrap = true } = options
  let currentIndex = 0

  const updateTabindex = () => {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndex ? '0' : '-1')
    })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const horizontalKeys = ['ArrowLeft', 'ArrowRight']
    const verticalKeys = ['ArrowUp', 'ArrowDown']

    let keys: string[] = []
    if (orientation === 'horizontal') keys = horizontalKeys
    else if (orientation === 'vertical') keys = verticalKeys
    else keys = [...horizontalKeys, ...verticalKeys]

    if (!keys.includes(e.key)) return

    e.preventDefault()

    const isForward = ['ArrowRight', 'ArrowDown'].includes(e.key)
    const delta = isForward ? 1 : -1

    currentIndex += delta

    if (wrap) {
      if (currentIndex < 0) currentIndex = items.length - 1
      if (currentIndex >= items.length) currentIndex = 0
    } else {
      currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1))
    }

    updateTabindex()
    items[currentIndex].focus()
  }

  const handleFocus = (e: FocusEvent) => {
    const index = items.indexOf(e.target as HTMLElement)
    if (index !== -1) {
      currentIndex = index
      updateTabindex()
    }
  }

  updateTabindex()
  container.addEventListener('keydown', handleKeyDown)
  items.forEach(item => item.addEventListener('focus', handleFocus))

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    items.forEach(item => item.removeEventListener('focus', handleFocus))
  }
}

/**
 * Debounce for reducing announcement frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get recommended animation duration based on user preferences
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs
}

/**
 * Validate ARIA attribute combinations
 */
export function validateARIA(element: HTMLElement): string[] {
  const errors: string[] = []
  const role = element.getAttribute('role')

  // Check for invalid role combinations
  if (role === 'button' && element.tagName === 'A' && !element.hasAttribute('href')) {
    errors.push('Button role on link requires href or use <button> instead')
  }

  // Check for required ARIA attributes
  if (role === 'checkbox' && !element.hasAttribute('aria-checked')) {
    errors.push('Checkbox role requires aria-checked attribute')
  }

  if (role === 'tab' && !element.hasAttribute('aria-selected')) {
    errors.push('Tab role requires aria-selected attribute')
  }

  if (role === 'slider' && !element.hasAttribute('aria-valuenow')) {
    errors.push('Slider role requires aria-valuenow attribute')
  }

  return errors
}
