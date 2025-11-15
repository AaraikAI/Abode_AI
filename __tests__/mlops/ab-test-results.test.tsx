import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ABTestResults } from "@/components/mlops/ab-test-results"

describe("ABTestResults", () => {
  const mockProps = {
    testConfig: {
      testId: 'test-123',
      name: 'Model A vs Model B Performance Test',
      status: 'running' as const,
      startDate: '2024-01-15T00:00:00Z',
      duration: '7 days',
      totalSamples: 85000,
      minimumSampleSize: 100000,
      confidenceLevel: 95
    },
    variantA: {
      id: 'model-a',
      name: 'Baseline Model',
      version: '1.0.0',
      trafficPercentage: 50
    },
    variantB: {
      id: 'model-b',
      name: 'Optimized Model',
      version: '2.0.0',
      trafficPercentage: 50
    },
    metricsA: {
      variantId: 'model-a',
      accuracy: 0.92,
      precision: 0.90,
      recall: 0.88,
      f1Score: 0.89,
      latencyP50: 45,
      latencyP95: 120,
      latencyP99: 180,
      throughput: 500,
      errorRate: 0.02,
      conversionRate: 0.15,
      userSatisfaction: 0.78,
      totalRequests: 42500
    },
    metricsB: {
      variantId: 'model-b',
      accuracy: 0.95,
      precision: 0.94,
      recall: 0.92,
      f1Score: 0.93,
      latencyP50: 38,
      latencyP95: 95,
      latencyP99: 140,
      throughput: 600,
      errorRate: 0.01,
      conversionRate: 0.18,
      userSatisfaction: 0.85,
      totalRequests: 42500
    },
    comparisons: [
      {
        metric: 'Accuracy',
        variantA: 0.92,
        variantB: 0.95,
        difference: 0.03,
        percentChange: 3.26,
        winner: 'B' as const,
        significance: 0.001,
        isSignificant: true
      },
      {
        metric: 'Latency P95',
        variantA: 120,
        variantB: 95,
        difference: -25,
        percentChange: -20.83,
        winner: 'B' as const,
        significance: 0.005,
        isSignificant: true
      }
    ],
    accuracyTimeSeries: [
      { timestamp: '2024-01-15', variantA: 0.91, variantB: 0.93 },
      { timestamp: '2024-01-16', variantA: 0.92, variantB: 0.95 }
    ],
    latencyTimeSeries: [
      { timestamp: '2024-01-15', variantA: 125, variantB: 100 },
      { timestamp: '2024-01-16', variantA: 120, variantB: 95 }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders A/B test results header", () => {
    render(<ABTestResults {...mockProps} />)
    expect(screen.getByText("A/B Test Results")).toBeTruthy()
    expect(screen.getByText("Model A vs Model B Performance Test")).toBeTruthy()
  })

  it("displays test status and configuration", () => {
    render(<ABTestResults {...mockProps} />)
    expect(screen.getByText("running")).toBeTruthy()
    expect(screen.getByText("95%")).toBeTruthy()
  })

  it("shows variant A information and metrics", () => {
    render(<ABTestResults {...mockProps} />)
    expect(screen.getByText("Baseline Model")).toBeTruthy()
    expect(screen.getByText("92.00%")).toBeTruthy()
  })

  it("shows variant B information and metrics", () => {
    render(<ABTestResults {...mockProps} />)
    expect(screen.getByText("Optimized Model")).toBeTruthy()
    expect(screen.getByText("95.00%")).toBeTruthy()
  })

  it("displays sample collection progress", () => {
    render(<ABTestResults {...mockProps} />)
    expect(screen.getByText("Sample Collection Progress")).toBeTruthy()
    expect(screen.getByText("85,000 / 100,000")).toBeTruthy()
  })

  it("shows statistical comparison table", () => {
    render(<ABTestResults {...mockProps} />)
    const comparisonTab = screen.getByText("Metric Comparison")
    fireEvent.click(comparisonTab)
    expect(screen.getByText("Accuracy")).toBeTruthy()
    expect(screen.getByText("Latency P95")).toBeTruthy()
  })

  it("displays winner badges correctly", () => {
    render(<ABTestResults {...mockProps} />)
    const comparisonTab = screen.getByText("Metric Comparison")
    fireEvent.click(comparisonTab)
    const variantBBadges = screen.getAllByText("Variant B")
    expect(variantBBadges.length).toBeGreaterThan(0)
  })

  it("shows accuracy trends over time", () => {
    render(<ABTestResults {...mockProps} />)
    const trendsTab = screen.getByText("Trends")
    fireEvent.click(trendsTab)
    expect(screen.getByText("Accuracy Over Time")).toBeTruthy()
  })

  it("calls onPauseTest when pause button is clicked", () => {
    const mockPause = jest.fn()
    render(<ABTestResults {...mockProps} onPauseTest={mockPause} />)
    const pauseButton = screen.getByText("Pause Test")
    fireEvent.click(pauseButton)
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it("calls onSelectWinner when deploy winner button is clicked", () => {
    const mockSelectWinner = jest.fn()
    const completedProps = {
      ...mockProps,
      testConfig: { ...mockProps.testConfig, status: 'completed' as const }
    }
    render(<ABTestResults {...completedProps} onSelectWinner={mockSelectWinner} />)
    const deployButton = screen.getByText("Deploy Winner")
    fireEvent.click(deployButton)
    expect(mockSelectWinner).toHaveBeenCalled()
  })
})
