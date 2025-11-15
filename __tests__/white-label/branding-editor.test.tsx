import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrandingEditor, { BrandingConfig } from '@/components/white-label/branding-editor'

describe('BrandingEditor', () => {
  const mockConfig: BrandingConfig = {
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#ff6600',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'inter',
  }

  const mockOnSave = jest.fn()
  const mockOnPreview = jest.fn()
  const mockOnReset = jest.fn()

  const defaultProps = {
    config: mockConfig,
    onSave: mockOnSave,
    onPreview: mockOnPreview,
    onReset: mockOnReset,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders branding editor header', () => {
    render(<BrandingEditor {...defaultProps} />)
    expect(screen.getByText('Branding Editor')).toBeTruthy()
  })

  it('displays all branding tabs', () => {
    render(<BrandingEditor {...defaultProps} />)
    expect(screen.getByText('Logos')).toBeTruthy()
    expect(screen.getByText('Colors')).toBeTruthy()
    expect(screen.getByText('Typography')).toBeTruthy()
    expect(screen.getByText('Custom CSS')).toBeTruthy()
  })

  it('shows preview and reset buttons', () => {
    render(<BrandingEditor {...defaultProps} />)
    expect(screen.getByText('Preview')).toBeTruthy()
    expect(screen.getByText('Reset')).toBeTruthy()
  })

  it('displays color inputs in colors tab', () => {
    render(<BrandingEditor {...defaultProps} />)
    const colorsTab = screen.getByText('Colors')
    fireEvent.click(colorsTab)

    expect(screen.getByLabelText('Primary Color')).toBeTruthy()
    expect(screen.getByLabelText('Secondary Color')).toBeTruthy()
    expect(screen.getByLabelText('Accent Color')).toBeTruthy()
  })

  it('allows changing primary color', () => {
    render(<BrandingEditor {...defaultProps} />)
    const colorsTab = screen.getByText('Colors')
    fireEvent.click(colorsTab)

    const primaryColorInput = screen.getByDisplayValue('#000000')
    fireEvent.change(primaryColorInput, { target: { value: '#ff0000' } })
    expect(screen.getByDisplayValue('#ff0000')).toBeTruthy()
  })

  it('shows font family selector in typography tab', () => {
    render(<BrandingEditor {...defaultProps} />)
    const typographyTab = screen.getByText('Typography')
    fireEvent.click(typographyTab)

    expect(screen.getByLabelText('Font Family')).toBeTruthy()
  })

  it('displays custom CSS textarea', () => {
    render(<BrandingEditor {...defaultProps} />)
    const cssTab = screen.getByText('Custom CSS')
    fireEvent.click(cssTab)

    expect(screen.getByLabelText('CSS Code')).toBeTruthy()
  })

  it('calls onPreview when preview button clicked', () => {
    render(<BrandingEditor {...defaultProps} />)
    const previewButton = screen.getByText('Preview')
    fireEvent.click(previewButton)

    expect(mockOnPreview).toHaveBeenCalledWith(expect.objectContaining({
      primaryColor: '#000000',
    }))
  })

  it('calls onSave when save button clicked', async () => {
    mockOnSave.mockResolvedValue(undefined)
    render(<BrandingEditor {...defaultProps} />)

    const saveButton = screen.getByText('Save Branding')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  it('calls onReset when reset button clicked', () => {
    render(<BrandingEditor {...defaultProps} />)
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)

    expect(mockOnReset).toHaveBeenCalled()
  })
})
