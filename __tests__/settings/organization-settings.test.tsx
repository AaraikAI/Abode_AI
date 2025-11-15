import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { OrganizationSettings } from "@/components/settings/organization-settings"

global.fetch = jest.fn()

describe("OrganizationSettings", () => {
  const mockOrganization = {
    id: "org-1",
    name: "Acme Inc.",
    slug: "acme-inc",
    description: "Leading architecture firm",
    website: "https://acme.com",
    industry: "architecture",
    size: "50-100",
  }

  const mockMembers = [
    {
      id: "member-1",
      userId: "user-1",
      name: "John Doe",
      email: "john@acme.com",
      avatar: "/avatar1.jpg",
      role: "owner" as const,
      status: "active" as const,
      joinedAt: "2024-01-01T00:00:00Z",
      lastActive: "2025-01-15T10:00:00Z",
    },
    {
      id: "member-2",
      userId: "user-2",
      name: "Jane Smith",
      email: "jane@acme.com",
      role: "admin" as const,
      status: "active" as const,
      joinedAt: "2024-02-01T00:00:00Z",
    },
    {
      id: "member-3",
      userId: "user-3",
      name: "Bob Johnson",
      email: "bob@acme.com",
      role: "member" as const,
      status: "pending" as const,
      joinedAt: "2025-01-10T00:00:00Z",
    },
  ]

  const mockBilling = {
    plan: "pro" as const,
    seats: 10,
    usedSeats: 3,
    billingCycle: "monthly" as const,
    nextBillingDate: "2025-02-01T00:00:00Z",
    paymentMethod: {
      type: "card" as const,
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2026,
    },
    totalSpend: 2500,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/organization/members")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ members: mockMembers }),
        })
      }
      if (url.includes("/organization/billing")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ billing: mockBilling }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ organization: mockOrganization }),
      })
    })
  })

  it("renders organization details section", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText("Organization Details")).toBeTruthy()
      expect(screen.getByLabelText("Organization Name")).toBeTruthy()
    })
  })

  it("displays team members table", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText("Team Members")).toBeTruthy()
      expect(screen.getByText("John Doe")).toBeTruthy()
      expect(screen.getByText("Jane Smith")).toBeTruthy()
      expect(screen.getByText("Bob Johnson")).toBeTruthy()
    })
  })

  it("shows member roles with correct badges", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText("owner")).toBeTruthy()
      expect(screen.getByText("admin")).toBeTruthy()
      expect(screen.getByText("member")).toBeTruthy()
    })
  })

  it("displays member status correctly", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getAllByText("active").length).toBeGreaterThan(0)
      expect(screen.getByText("pending")).toBeTruthy()
    })
  })

  it("shows crown icon for organization owner", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      const crowns = document.querySelectorAll('[class*="text-yellow"]')
      expect(crowns.length).toBeGreaterThan(0)
    })
  })

  it("opens invite dialog when Invite Member button is clicked", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeTruthy()
    })

    const inviteButton = screen.getByText("Invite Member")
    fireEvent.click(inviteButton)

    await waitFor(() => {
      expect(screen.getByText("Invite Team Member")).toBeTruthy()
      expect(screen.getByLabelText("Email Address")).toBeTruthy()
      expect(screen.getByLabelText("Role")).toBeTruthy()
    })
  })

  it("sends invitation with correct data", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<OrganizationSettings />)

    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeTruthy()
    })

    const inviteButton = screen.getByText("Invite Member")
    fireEvent.click(inviteButton)

    await waitFor(() => {
      expect(screen.getByLabelText("Email Address")).toBeTruthy()
    })

    const emailInput = screen.getByLabelText("Email Address")
    fireEvent.change(emailInput, { target: { value: "newmember@acme.com" } })

    const sendButton = screen.getByText("Send Invitation")
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/organization/members/invite",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  })

  it("displays billing information", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText("Billing & Subscription")).toBeTruthy()
      expect(screen.getByText(/pro/i)).toBeTruthy()
    })
  })

  it("shows seat usage statistics", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      expect(screen.getByText(/3.*\/.*10/)).toBeTruthy()
    })
  })

  it("disables actions for organization owner", async () => {
    render(<OrganizationSettings />)
    await waitFor(() => {
      const moreButtons = screen.getAllByRole("button").filter(
        (btn) => btn.querySelector('svg') && btn.disabled
      )
      expect(moreButtons.length).toBeGreaterThan(0)
    })
  })
})
