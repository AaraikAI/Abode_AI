import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { Recommendations, Recommendation } from "@/components/cost/recommendations"

describe("Recommendations", () => {
  const mockRecommendations: Recommendation[] = [
    {
      id: "1",
      category: "material",
      title: "Alternative Material Option",
      description: "Use recycled concrete instead of new pour",
      estimatedSavings: 5000,
      savingsPercentage: 10,
      confidence: "high",
      impact: "medium",
      implementation: "easy",
      timeToImplement: "1 week",
      status: "pending",
    },
    {
      id: "2",
      category: "labor",
      title: "Optimize Labor Schedule",
      description: "Adjust crew schedule to reduce overtime",
      estimatedSavings: 3000,
      savingsPercentage: 7.5,
      confidence: "medium",
      impact: "high",
      implementation: "moderate",
      status: "accepted",
    },
  ]

  const mockOnUpdate = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    currentCost: 100000,
    recommendations: mockRecommendations,
    onRecommendationUpdate: mockOnUpdate,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders recommendations header", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Cost Recommendations")).toBeTruthy()
  })

  it("displays generate recommendations button", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Generate Recommendations")).toBeTruthy()
  })

  it("shows total potential savings card", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Total Potential Savings")).toBeTruthy()
  })

  it("displays accepted savings card", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Accepted Savings")).toBeTruthy()
  })

  it("shows total recommendations count", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Total Recommendations")).toBeTruthy()
  })

  it("displays acceptance rate", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Acceptance Rate")).toBeTruthy()
  })

  it("renders recommendation cards with titles", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("Alternative Material Option")).toBeTruthy()
    expect(screen.getByText("Optimize Labor Schedule")).toBeTruthy()
  })

  it("shows confidence badges", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText("high confidence")).toBeTruthy()
    expect(screen.getByText("medium confidence")).toBeTruthy()
  })

  it("displays category filter buttons", () => {
    render(<Recommendations {...defaultProps} />)
    expect(screen.getByText(/Material/)).toBeTruthy()
    expect(screen.getByText(/Labor/)).toBeTruthy()
  })

  it("shows accept button for pending recommendations", () => {
    render(<Recommendations {...defaultProps} />)
    const acceptButtons = screen.getAllByText("Accept")
    expect(acceptButtons.length).toBeGreaterThan(0)
  })
})
