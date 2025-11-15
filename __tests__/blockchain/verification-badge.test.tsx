import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { VerificationBadgeComponent, VerificationBadge } from "@/components/blockchain/verification-badge"

describe("VerificationBadge", () => {
  const mockBadges: VerificationBadge[] = [
    {
      id: "1",
      type: "certification",
      name: "LEED Platinum Certification",
      description: "Highest level of green building certification",
      issuer: "US Green Building Council",
      issuedTo: "Acme Construction Co.",
      issuedAt: "2024-01-01T10:00:00Z",
      expiresAt: "2026-01-01T10:00:00Z",
      status: "active",
      blockchainHash: "0xhash123456789abcdef",
      credentialId: "LEED-2024-001",
      metadata: {
        standard: "LEED v4.1",
        score: 95,
        criteria: {
          "Energy Efficiency": true,
          "Water Conservation": true,
          "Materials Selection": true,
          "Indoor Air Quality": true,
        },
        verificationLevel: "premium",
      },
      claims: [
        {
          id: "c1",
          type: "Energy Efficiency",
          value: "95%",
          verifiedBy: "USGBC Inspector",
          verifiedAt: "2023-12-15T14:00:00Z",
          blockchainProof: "0xproof123",
        },
      ],
      chain: "Ethereum",
      verified: true,
    },
    {
      id: "2",
      type: "authenticity",
      name: "Material Authenticity Certificate",
      description: "Verified authentic recycled steel",
      issuer: "Materials Verification Inc.",
      issuedTo: "Steel Supplier Ltd.",
      issuedAt: "2024-01-15T09:00:00Z",
      status: "active",
      blockchainHash: "0xhash987654321fedcba",
      credentialId: "AUTH-2024-042",
      metadata: {
        score: 100,
        verificationLevel: "standard",
      },
      claims: [
        {
          id: "c2",
          type: "Recycled Content",
          value: 85,
          verifiedBy: "Lab Testing Co.",
          verifiedAt: "2024-01-10T11:00:00Z",
          blockchainProof: "0xproof456",
        },
      ],
      chain: "Polygon",
      verified: true,
    },
    {
      id: "3",
      type: "compliance",
      name: "Building Code Compliance",
      description: "Meets all local building codes",
      issuer: "City Building Department",
      issuedTo: "Developer XYZ",
      issuedAt: "2024-02-01T08:00:00Z",
      status: "pending",
      blockchainHash: "0xhashpending123",
      credentialId: "COMP-2024-789",
      metadata: {
        verificationLevel: "basic",
        criteria: {
          "Structural Safety": true,
          "Fire Safety": false,
          "Accessibility": true,
        },
      },
      claims: [],
      chain: "Ethereum",
      verified: false,
    },
    {
      id: "4",
      type: "quality",
      name: "Quality Assurance Certificate",
      description: "Premium quality construction materials",
      issuer: "Quality Standards Board",
      issuedTo: "BuildRight Inc.",
      issuedAt: "2023-06-01T10:00:00Z",
      expiresAt: "2024-06-01T10:00:00Z",
      status: "expired",
      blockchainHash: "0xhashexpired456",
      credentialId: "QA-2023-555",
      metadata: {
        score: 88,
        verificationLevel: "standard",
      },
      claims: [],
      chain: "Ethereum",
      verified: true,
    },
  ]

  const mockProps = {
    badges: mockBadges,
    onVerifyBadge: jest.fn(),
    onDownloadCertificate: jest.fn(),
    onViewBlockchain: jest.fn(),
    onRequestBadge: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders verification badge component with title and description", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Verification Badges")).toBeTruthy()
    expect(screen.getByText(/Blockchain-verified certifications and authenticity badges/i)).toBeTruthy()
  })

  it("displays total badges count", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Total Badges")).toBeTruthy()
    expect(screen.getByText("4")).toBeTruthy()
  })

  it("shows active badges count", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Active")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("displays verified badges count", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Verified")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows pending badges count", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Pending")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("renders all badge cards with names", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("LEED Platinum Certification")).toBeTruthy()
    expect(screen.getByText("Material Authenticity Certificate")).toBeTruthy()
    expect(screen.getByText("Building Code Compliance")).toBeTruthy()
  })

  it("displays badge type badges", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("certification")).toBeTruthy()
    expect(screen.getByText("authenticity")).toBeTruthy()
    expect(screen.getByText("compliance")).toBeTruthy()
  })

  it("shows verification level badges", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    expect(screen.getByText("Premium")).toBeTruthy()
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0)
    expect(screen.getByText("Basic")).toBeTruthy()
  })

  it("opens request dialog when clicking request badge button", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    const requestButton = screen.getByText("Request Badge")
    fireEvent.click(requestButton)
    expect(screen.getByText("Request Verification Badge")).toBeTruthy()
    expect(screen.getByText("Choose the type of verification badge you need")).toBeTruthy()
  })

  it("filters badges by type when tab is clicked", () => {
    render(<VerificationBadgeComponent {...mockProps} />)
    const certsTab = screen.getByText("Certs")
    fireEvent.click(certsTab)

    waitFor(() => {
      expect(screen.getByText("LEED Platinum Certification")).toBeTruthy()
      expect(screen.queryByText("Material Authenticity Certificate")).toBeFalsy()
    })
  })
})
