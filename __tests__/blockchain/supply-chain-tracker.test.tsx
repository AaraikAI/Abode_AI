import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SupplyChainTracker, SupplyChainItem } from "@/components/blockchain/supply-chain-tracker"

describe("SupplyChainTracker", () => {
  const mockShipments: SupplyChainItem[] = [
    {
      id: "1",
      materialName: "Steel Beams",
      materialType: "Steel",
      quantity: 500,
      unit: "tons",
      supplier: "SteelWorks Inc.",
      destination: "New York, NY",
      currentLocation: "Chicago, IL",
      progress: 60,
      status: "in-transit",
      stages: [
        {
          id: "s1",
          name: "Pickup from Warehouse",
          status: "completed",
          location: "Pittsburgh, PA",
          timestamp: "2024-01-01T10:00:00Z",
          actor: "SteelWorks Inc.",
          blockchainHash: "0xabc123",
          transportMethod: "truck",
        },
        {
          id: "s2",
          name: "In Transit to Distribution Center",
          status: "in-progress",
          location: "Chicago, IL",
          timestamp: "2024-01-02T14:00:00Z",
          actor: "TransLog LLC",
          estimatedArrival: "2024-01-03T18:00:00Z",
          transportMethod: "truck",
        },
        {
          id: "s3",
          name: "Final Delivery",
          status: "pending",
          location: "New York, NY",
          actor: "Local Delivery Co.",
          estimatedArrival: "2024-01-04T10:00:00Z",
          transportMethod: "truck",
        },
      ],
      startDate: "2024-01-01T10:00:00Z",
      estimatedDelivery: "2024-01-04T10:00:00Z",
      trackingNumber: "TRK123456",
      blockchainVerified: true,
    },
    {
      id: "2",
      materialName: "Concrete Mix",
      materialType: "Concrete",
      quantity: 1000,
      unit: "m³",
      supplier: "ConcretePlus",
      destination: "Los Angeles, CA",
      currentLocation: "Los Angeles, CA",
      progress: 100,
      status: "delivered",
      stages: [
        {
          id: "s4",
          name: "Delivered",
          status: "completed",
          location: "Los Angeles, CA",
          timestamp: "2024-01-05T16:00:00Z",
          actualArrival: "2024-01-05T16:00:00Z",
          actor: "ConcretePlus",
        },
      ],
      startDate: "2024-01-04T08:00:00Z",
      estimatedDelivery: "2024-01-05T16:00:00Z",
      actualDelivery: "2024-01-05T16:00:00Z",
      trackingNumber: "TRK789012",
      blockchainVerified: true,
    },
    {
      id: "3",
      materialName: "Glass Panels",
      materialType: "Glass",
      quantity: 200,
      unit: "m²",
      supplier: "ClearView Glass",
      destination: "Miami, FL",
      currentLocation: "Atlanta, GA",
      progress: 40,
      status: "delayed",
      stages: [
        {
          id: "s5",
          name: "Delayed at Warehouse",
          status: "delayed",
          location: "Atlanta, GA",
          timestamp: "2024-01-06T10:00:00Z",
          actor: "Warehouse Services",
          notes: "Weather delay",
        },
      ],
      startDate: "2024-01-05T09:00:00Z",
      estimatedDelivery: "2024-01-08T14:00:00Z",
      trackingNumber: "TRK345678",
      blockchainVerified: false,
    },
  ]

  const mockProps = {
    shipments: mockShipments,
    onRefresh: jest.fn(),
    onTrackShipment: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders supply chain tracker with title and description", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("Supply Chain Tracker")).toBeTruthy()
    expect(screen.getByText(/Track materials from source to installation/i)).toBeTruthy()
  })

  it("displays total shipments count", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("Total Shipments")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows in-transit shipments count", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("In Transit")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("displays delivered shipments count", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("Delivered")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows delayed shipments count", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("Delayed")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("renders all shipment cards with material names", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("Steel Beams")).toBeTruthy()
    expect(screen.getByText("Concrete Mix")).toBeTruthy()
    expect(screen.getByText("Glass Panels")).toBeTruthy()
  })

  it("displays progress bars for shipments", () => {
    render(<SupplyChainTracker {...mockProps} />)
    expect(screen.getByText("60%")).toBeTruthy()
    expect(screen.getByText("100%")).toBeTruthy()
    expect(screen.getByText("40%")).toBeTruthy()
  })

  it("shows blockchain verified badge for verified shipments", () => {
    render(<SupplyChainTracker {...mockProps} />)
    const verifiedBadges = screen.getAllByText("Verified")
    expect(verifiedBadges.length).toBeGreaterThan(0)
  })

  it("calls onRefresh when refresh button is clicked", () => {
    render(<SupplyChainTracker {...mockProps} />)
    const refreshButton = screen.getByText("Refresh Tracking")
    fireEvent.click(refreshButton)
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1)
  })

  it("filters shipments by status when tab is clicked", () => {
    render(<SupplyChainTracker {...mockProps} />)
    const inTransitTab = screen.getByText("In Transit")
    fireEvent.click(inTransitTab)

    waitFor(() => {
      expect(screen.getByText("Steel Beams")).toBeTruthy()
      expect(screen.queryByText("Concrete Mix")).toBeFalsy()
    })
  })
})
