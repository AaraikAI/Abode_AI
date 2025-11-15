import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { PushNotificationSettings, NotificationPreferences } from "@/components/mobile/push-notification-settings"

describe("PushNotificationSettings", () => {
  const mockPreferences: Partial<NotificationPreferences> = {
    masterEnabled: true,
    groupNotifications: true,
    showPreviews: true,
    persistentNotifications: false,
    soundVolume: 0.7
  }

  const mockOnPreferencesChange = jest.fn()
  const mockOnTestNotification = jest.fn()

  const defaultProps = {
    preferences: mockPreferences,
    onPreferencesChange: mockOnPreferencesChange,
    onTestNotification: mockOnTestNotification
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders push notifications header", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Push Notifications")).toBeTruthy()
  })

  it("displays notification channels section", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Notification Channels")).toBeTruthy()
  })

  it("shows master notification toggle", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Manage notification channels and preferences")).toBeTruthy()
  })

  it("displays individual notification channels", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Messages")).toBeTruthy()
    expect(screen.getByText("Project Updates")).toBeTruthy()
    expect(screen.getByText("Calendar Events")).toBeTruthy()
  })

  it("shows send test button", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Send Test")).toBeTruthy()
  })

  it("displays quiet hours section", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Quiet Hours")).toBeTruthy()
    expect(screen.getByText("Mute notifications during specific times")).toBeTruthy()
  })

  it("shows additional settings section", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Additional Settings")).toBeTruthy()
  })

  it("displays group notifications toggle", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Group Notifications")).toBeTruthy()
  })

  it("shows message previews toggle", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Show Message Previews")).toBeTruthy()
  })

  it("displays reset to defaults button", () => {
    render(<PushNotificationSettings {...defaultProps} />)
    expect(screen.getByText("Reset to Defaults")).toBeTruthy()
  })
})
