import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NFTGallery, NFT } from "@/components/blockchain/nft-gallery"

describe("NFTGallery", () => {
  const mockNFTs: NFT[] = [
    {
      id: "1",
      tokenId: "1001",
      contractAddress: "0xNFTContract123",
      name: "Modern Villa Design",
      description: "A beautiful modern villa with sustainable architecture",
      imageUrl: "https://example.com/villa.jpg",
      owner: {
        address: "0xowner1",
        name: "Alice Builder",
        avatar: "https://example.com/alice.jpg",
      },
      creator: {
        address: "0xcreator1",
        name: "Bob Architect",
        avatar: "https://example.com/bob.jpg",
      },
      metadata: {
        name: "Modern Villa Design",
        description: "A beautiful modern villa",
        image: "https://example.com/villa.jpg",
        attributes: [
          { trait_type: "Style", value: "Modern" },
          { trait_type: "Size", value: 5000 },
          { trait_type: "Sustainability", value: "LEED Platinum" },
        ],
      },
      mintedAt: "2024-01-01T10:00:00Z",
      lastSale: {
        price: 2.5,
        currency: "ETH",
        date: "2024-01-15T14:00:00Z",
      },
      chain: "Ethereum",
      verified: true,
      favorites: 42,
      views: 1250,
      category: "building",
    },
    {
      id: "2",
      tokenId: "1002",
      contractAddress: "0xNFTContract123",
      name: "Sustainable Office Complex",
      description: "Eco-friendly office building design",
      imageUrl: "https://example.com/office.jpg",
      owner: {
        address: "0xowner2",
        name: "Charlie Developer",
      },
      creator: {
        address: "0xcreator2",
        name: "Diana Designer",
      },
      metadata: {
        name: "Sustainable Office Complex",
        description: "Eco-friendly office building",
        image: "https://example.com/office.jpg",
        attributes: [
          { trait_type: "Style", value: "Contemporary" },
          { trait_type: "Floors", value: 12 },
        ],
      },
      mintedAt: "2024-01-10T11:00:00Z",
      lastSale: {
        price: 3.8,
        currency: "ETH",
        date: "2024-01-20T16:00:00Z",
      },
      chain: "Ethereum",
      verified: true,
      favorites: 67,
      views: 2100,
      category: "building",
    },
    {
      id: "3",
      tokenId: "1003",
      contractAddress: "0xNFTContract456",
      name: "Interior Design Concept",
      description: "Minimalist interior design for modern homes",
      imageUrl: "https://example.com/interior.jpg",
      owner: {
        address: "0xowner3",
      },
      creator: {
        address: "0xcreator3",
      },
      metadata: {
        name: "Interior Design Concept",
        description: "Minimalist interior design",
        image: "https://example.com/interior.jpg",
        attributes: [
          { trait_type: "Style", value: "Minimalist" },
          { trait_type: "Color Scheme", value: "Neutral" },
        ],
      },
      mintedAt: "2024-01-20T09:00:00Z",
      chain: "Polygon",
      verified: false,
      favorites: 28,
      views: 850,
      category: "design",
    },
  ]

  const mockTransferHistory = {
    "1001": [
      {
        id: "t1",
        from: "0xcreator1",
        to: "0xowner1",
        timestamp: "2024-01-15T14:00:00Z",
        transactionHash: "0xtx123",
        price: 2.5,
        currency: "ETH",
      },
    ],
  }

  const mockProps = {
    nfts: mockNFTs,
    onTransfer: jest.fn(),
    onDownload: jest.fn(),
    onViewTransaction: jest.fn(),
    transferHistory: mockTransferHistory,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders NFT gallery with title and description", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("NFT Gallery")).toBeTruthy()
    expect(screen.getByText(/Building and design NFTs with blockchain ownership/i)).toBeTruthy()
  })

  it("displays total NFTs count", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("Total NFTs")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows verified NFTs count", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("Verified")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("displays total value of NFTs", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("Total Value")).toBeTruthy()
    expect(screen.getByText(/6.30 ETH/i)).toBeTruthy()
  })

  it("shows total views across all NFTs", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("Total Views")).toBeTruthy()
    expect(screen.getByText(/4,200/i)).toBeTruthy()
  })

  it("renders all NFT cards with names and descriptions", () => {
    render(<NFTGallery {...mockProps} />)
    expect(screen.getByText("Modern Villa Design")).toBeTruthy()
    expect(screen.getByText("Sustainable Office Complex")).toBeTruthy()
    expect(screen.getByText("Interior Design Concept")).toBeTruthy()
  })

  it("displays NFT category badges", () => {
    render(<NFTGallery {...mockProps} />)
    const buildingBadges = screen.getAllByText("building")
    const designBadges = screen.getAllByText("design")
    expect(buildingBadges.length).toBe(2)
    expect(designBadges.length).toBe(1)
  })

  it("shows verified badges for verified NFTs", () => {
    render(<NFTGallery {...mockProps} />)
    const verifiedBadges = screen.getAllByText("Verified")
    expect(verifiedBadges.length).toBeGreaterThan(0)
  })

  it("filters NFTs by category when tab is clicked", () => {
    render(<NFTGallery {...mockProps} />)
    const designTab = screen.getByText("Designs")
    fireEvent.click(designTab)

    waitFor(() => {
      expect(screen.getByText("Interior Design Concept")).toBeTruthy()
      expect(screen.queryByText("Modern Villa Design")).toBeFalsy()
    })
  })

  it("opens NFT details dialog when clicking on an NFT card", () => {
    render(<NFTGallery {...mockProps} />)
    const nftCard = screen.getByText("Modern Villa Design")
    fireEvent.click(nftCard)

    waitFor(() => {
      expect(screen.getByText(/Token ID: #1001/i)).toBeTruthy()
      expect(screen.getByText("Details")).toBeTruthy()
      expect(screen.getByText("Attributes")).toBeTruthy()
      expect(screen.getByText("History")).toBeTruthy()
    })
  })
})
