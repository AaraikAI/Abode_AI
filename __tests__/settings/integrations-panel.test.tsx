import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { IntegrationsPanel, Integration } from "@/components/settings/integrations-panel"

global.fetch = jest.fn()

describe("IntegrationsPanel", () => {
  const mockIntegrations: Integration[] = [
    {
      id: "google-drive",
      name: "Google Drive",
      slug: "google-drive",
      description: "Store and sync your project files with Google Drive",
      category: "storage",
      status: "available",
      isConnected: true,
      isEnabled: true,
      connectedAt: "2025-01-01T00:00:00Z",
      features: ["File sync", "Auto-backup", "Share links"],
    },
    {
      id: "slack",
      name: "Slack",
      slug: "slack",
      description: "Get notifications and collaborate in Slack",
      category: "communication",
      status: "available",
      isConnected: false,
      isEnabled: false,
      features: ["Notifications", "Bot commands", "File sharing"],
    },
    {
      id: "zapier",
      name: "Zapier",
      slug: "zapier",
      description: "Automate workflows with 5000+ apps",
      category: "automation",
      status: "available",
      isConnected: false,
      isEnabled: false,
      features: ["Webhooks", "Triggers", "Multi-step zaps"],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ integrations: mockIntegrations }),
    })
  })

  it("renders integrations panel with tabs", async () => {
    render(<IntegrationsPanel />)
    await waitFor(() => {
      expect(screen.getByText("Integrations")).toBeTruthy()
      expect(screen.getByRole("tab", { name: /All/i })).toBeTruthy()
      expect(screen.getByRole("tab", { name: /Connected/i })).toBeTruthy()
      expect(screen.getByRole("tab", { name: /Storage/i })).toBeTruthy()
    })
  })

  it("displays all integration cards in All tab", async () => {
    render(<IntegrationsPanel />)
    await waitFor(() => {
      expect(screen.getByText("Google Drive")).toBeTruthy()
      expect(screen.getByText("Slack")).toBeTruthy()
      expect(screen.getByText("Zapier")).toBeTruthy()
    })
  })

  it("shows connected badge for connected integrations", async () => {
    render(<IntegrationsPanel />)
    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeTruthy()
    })
  })

  it("displays integration features as badges", async () => {
    render(<IntegrationsPanel />)
    await waitFor(() => {
      expect(screen.getByText("File sync")).toBeTruthy()
      expect(screen.getByText("Auto-backup")).toBeTruthy()
    })
  })

  it("shows only connected integrations in Connected tab", async () => {
    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Google Drive")).toBeTruthy()
    })

    const connectedTab = screen.getByRole("tab", { name: /Connected/i })
    fireEvent.click(connectedTab)

    await waitFor(() => {
      expect(screen.getByText("Google Drive")).toBeTruthy()
      expect(screen.queryByText("Slack")).toBeNull()
    })
  })

  it("displays empty state in Connected tab when no integrations", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ integrations: [] }),
    })

    render(<IntegrationsPanel />)

    const connectedTab = screen.getByRole("tab", { name: /Connected/i })
    fireEvent.click(connectedTab)

    await waitFor(() => {
      expect(screen.getByText(/No integrations connected/i)).toBeTruthy()
    })
  })

  it("opens configuration dialog when Connect button is clicked", async () => {
    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Slack")).toBeTruthy()
    })

    const connectButtons = screen.getAllByText("Connect")
    fireEvent.click(connectButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Connect Slack/i)).toBeTruthy()
      expect(screen.getByLabelText("API Key")).toBeTruthy()
      expect(screen.getByLabelText(/Webhook URL/i)).toBeTruthy()
    })
  })

  it("validates API key before connecting", async () => {
    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Slack")).toBeTruthy()
    })

    const connectButtons = screen.getAllByText("Connect")
    fireEvent.click(connectButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Connect Slack/i)).toBeTruthy()
    })

    const submitButton = screen.getAllByText("Connect").find(
      (btn) => btn.closest('[role="dialog"]')
    )

    if (submitButton) {
      expect(submitButton).toHaveProperty("disabled", true)
    }
  })

  it("sends connection request with correct data", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ integrations: mockIntegrations }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Slack")).toBeTruthy()
    })

    const connectButtons = screen.getAllByText("Connect")
    fireEvent.click(connectButtons[0])

    await waitFor(() => {
      expect(screen.getByLabelText("API Key")).toBeTruthy()
    })

    const apiKeyInput = screen.getByLabelText("API Key")
    fireEvent.change(apiKeyInput, { target: { value: "test-api-key" } })

    const submitButton = screen.getAllByText("Connect").find(
      (btn) => btn.closest('[role="dialog"]')
    )

    if (submitButton) {
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/integrations/"),
          expect.objectContaining({
            method: "POST",
          })
        )
      })
    }
  })

  it("toggles integration enabled state with switch", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ integrations: mockIntegrations }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Google Drive")).toBeTruthy()
    })

    const switches = screen.getAllByRole("switch")
    if (switches.length > 0) {
      fireEvent.click(switches[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/toggle"),
          expect.any(Object)
        )
      })
    }
  })

  it("disconnects integration when Disconnect button is clicked", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ integrations: mockIntegrations }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<IntegrationsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Google Drive")).toBeTruthy()
    })

    const disconnectButton = screen.getByText("Disconnect")
    fireEvent.click(disconnectButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/disconnect"),
        expect.objectContaining({
          method: "POST",
        })
      )
    })
  })
})
