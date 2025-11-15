import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SmartContractViewer, SmartContract } from "@/components/blockchain/smart-contract-viewer"

describe("SmartContractViewer", () => {
  const mockContracts: SmartContract[] = [
    {
      id: "1",
      name: "Material Escrow Contract",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      type: "escrow",
      status: "active",
      deployedAt: "2024-01-01T10:00:00Z",
      owner: "0xowner123456789",
      network: "Ethereum Mainnet",
      balance: 10.5,
      functions: [
        {
          name: "deposit",
          type: "payable",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "recipient", type: "address" },
          ],
          description: "Deposit funds into escrow",
        },
        {
          name: "release",
          type: "write",
          inputs: [{ name: "escrowId", type: "uint256" }],
          description: "Release escrowed funds",
        },
        {
          name: "getBalance",
          type: "read",
          inputs: [],
          outputs: [{ name: "balance", type: "uint256" }],
          description: "Get escrow balance",
        },
      ],
      events: [
        {
          id: "e1",
          name: "FundsDeposited",
          timestamp: "2024-01-02T14:30:00Z",
          blockNumber: 18500000,
          transactionHash: "0xtxhash123456789abcdef",
          parameters: {
            from: "0xsender123",
            amount: "5000000000000000000",
            escrowId: "42",
          },
        },
      ],
      transactions: [
        {
          id: "tx1",
          hash: "0xtxhash123456789abcdef",
          from: "0xsender123",
          to: "0x1234567890abcdef1234567890abcdef12345678",
          value: 5,
          timestamp: "2024-01-02T14:30:00Z",
          blockNumber: 18500000,
          status: "success",
          gasUsed: 50000,
          functionCalled: "deposit",
        },
      ],
      metadata: {
        version: "1.0.0",
        compiler: "solc 0.8.20",
        verified: true,
      },
    },
    {
      id: "2",
      name: "Payment Distribution",
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      type: "payments",
      status: "active",
      deployedAt: "2024-01-05T09:00:00Z",
      owner: "0xowner987654321",
      network: "Polygon",
      functions: [
        {
          name: "distributePayment",
          type: "write",
          inputs: [
            { name: "recipients", type: "address[]" },
            { name: "amounts", type: "uint256[]" },
          ],
        },
      ],
      events: [],
      transactions: [],
      metadata: {
        verified: false,
      },
    },
    {
      id: "3",
      name: "Material Certification",
      address: "0xdef123456789abcdef123456789abcdef1234567",
      type: "certification",
      status: "paused",
      deployedAt: "2024-01-10T12:00:00Z",
      owner: "0xowner111222333",
      network: "Ethereum Mainnet",
      functions: [],
      events: [],
      transactions: [],
      metadata: {
        verified: true,
      },
    },
  ]

  const mockProps = {
    contracts: mockContracts,
    onExecuteFunction: jest.fn(),
    onViewTransaction: jest.fn(),
    onRefresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders smart contract viewer with title and description", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Smart Contract Viewer")).toBeTruthy()
    expect(screen.getByText(/View and interact with blockchain smart contracts/i)).toBeTruthy()
  })

  it("displays total contracts count", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Total Contracts")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows active contracts count", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Active")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("displays total transactions count", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Transactions")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows total events count", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Events")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("renders all contract cards with names and addresses", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("Material Escrow Contract")).toBeTruthy()
    expect(screen.getByText("Payment Distribution")).toBeTruthy()
    expect(screen.getByText("Material Certification")).toBeTruthy()
  })

  it("shows contract type badges", () => {
    render(<SmartContractViewer {...mockProps} />)
    expect(screen.getByText("escrow")).toBeTruthy()
    expect(screen.getByText("payments")).toBeTruthy()
    expect(screen.getByText("certification")).toBeTruthy()
  })

  it("displays verified badges for verified contracts", () => {
    render(<SmartContractViewer {...mockProps} />)
    const verifiedBadges = screen.getAllByText("Verified")
    expect(verifiedBadges.length).toBe(2)
  })

  it("calls onRefresh when refresh button is clicked", () => {
    render(<SmartContractViewer {...mockProps} />)
    const refreshButton = screen.getByText("Refresh")
    fireEvent.click(refreshButton)
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1)
  })

  it("opens contract details when clicking on a contract card", () => {
    render(<SmartContractViewer {...mockProps} />)
    const contractCard = screen.getByText("Material Escrow Contract")
    fireEvent.click(contractCard)

    waitFor(() => {
      expect(screen.getByText("Functions")).toBeTruthy()
      expect(screen.getByText("Events")).toBeTruthy()
      expect(screen.getByText("Transactions")).toBeTruthy()
    })
  })
})
