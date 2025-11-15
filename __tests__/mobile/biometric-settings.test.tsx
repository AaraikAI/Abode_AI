import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BiometricSettings, BiometricSettings as BiometricSettingsType } from "@/components/mobile/biometric-settings"

describe("BiometricSettings", () => {
  const mockSettings: Partial<BiometricSettingsType> = {
    enabled: true,
    requireForLogin: true,
    requireForPayments: true,
    requireForSensitiveData: true,
    fallbackToPassword: true,
    maxAttempts: 3,
    lockoutDuration: 300,
    reAuthInterval: 30
  }

  const mockOnSettingsChange = jest.fn()
  const mockOnEnrollBiometric = jest.fn()
  const mockOnRemoveBiometric = jest.fn()
  const mockOnTestBiometric = jest.fn()

  const defaultProps = {
    settings: mockSettings,
    onSettingsChange: mockOnSettingsChange,
    onEnrollBiometric: mockOnEnrollBiometric,
    onRemoveBiometric: mockOnRemoveBiometric,
    onTestBiometric: mockOnTestBiometric
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders biometric authentication header", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Biometric Authentication")).toBeTruthy()
  })

  it("displays biometric description", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Use biometrics for secure, password-free access")).toBeTruthy()
  })

  it("shows enrolled count statistic", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Enrolled")).toBeTruthy()
  })

  it("displays available methods section", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Available Methods")).toBeTruthy()
    expect(screen.getByText("Enroll and manage biometric methods")).toBeTruthy()
  })

  it("shows biometric method options", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Face ID")).toBeTruthy()
    expect(screen.getByText("Fingerprint")).toBeTruthy()
    expect(screen.getByText("Iris Scan")).toBeTruthy()
  })

  it("displays security settings section", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Security Settings")).toBeTruthy()
    expect(screen.getByText("Configure when biometrics are required")).toBeTruthy()
  })

  it("shows require for login toggle", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Require for Login")).toBeTruthy()
  })

  it("displays require for payments toggle", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Require for Payments")).toBeTruthy()
  })

  it("shows fallback to password option", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Fallback to Password")).toBeTruthy()
  })

  it("displays advanced settings section", () => {
    render(<BiometricSettings {...defaultProps} />)
    expect(screen.getByText("Advanced Settings")).toBeTruthy()
    expect(screen.getByText("Maximum Attempts")).toBeTruthy()
    expect(screen.getByText("Lockout Duration")).toBeTruthy()
  })
})
