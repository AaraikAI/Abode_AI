import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ModelMetrics } from "@/components/mlops/model-metrics"

describe("ModelMetrics", () => {
  const mockProps = {
    modelInfo: {
      id: 'model-123',
      name: 'fraud-detector',
      version: '3.2.1',
      framework: 'scikit-learn',
      dataset: 'fraud-dataset-v2',
      lastEvaluated: '2 hours ago'
    },
    metrics: {
      accuracy: 0.945,
      precision: 0.932,
      recall: 0.918,
      f1Score: 0.925,
      roc_auc: 0.975,
      pr_auc: 0.968,
      mcc: 0.856,
      specificity: 0.952
    },
    confusionMatrix: {
      truePositive: 1850,
      trueNegative: 9520,
      falsePositive: 480,
      falseNegative: 150
    },
    classwiseMetrics: {
      classes: [
        {
          className: 'Legitimate',
          precision: 0.95,
          recall: 0.96,
          f1Score: 0.955,
          support: 10000
        },
        {
          className: 'Fraudulent',
          precision: 0.91,
          recall: 0.88,
          f1Score: 0.895,
          support: 2000
        }
      ]
    },
    metricTrends: [
      {
        timestamp: '2024-01-10',
        accuracy: 0.92,
        precision: 0.91,
        recall: 0.89,
        f1Score: 0.90
      },
      {
        timestamp: '2024-01-15',
        accuracy: 0.945,
        precision: 0.932,
        recall: 0.918,
        f1Score: 0.925
      }
    ],
    thresholdAnalysis: [
      {
        threshold: 0.3,
        precision: 0.85,
        recall: 0.95,
        f1Score: 0.90
      },
      {
        threshold: 0.5,
        precision: 0.93,
        recall: 0.92,
        f1Score: 0.925
      },
      {
        threshold: 0.7,
        precision: 0.97,
        recall: 0.85,
        f1Score: 0.91
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders model metrics header", () => {
    render(<ModelMetrics {...mockProps} />)
    expect(screen.getByText("Model Performance Metrics")).toBeTruthy()
    expect(screen.getByText(/fraud-detector v3.2.1/i)).toBeTruthy()
  })

  it("displays model information", () => {
    render(<ModelMetrics {...mockProps} />)
    expect(screen.getByText("model-123")).toBeTruthy()
    expect(screen.getByText("fraud-dataset-v2")).toBeTruthy()
  })

  it("shows key performance metrics", () => {
    render(<ModelMetrics {...mockProps} />)
    expect(screen.getByText("94.50%")).toBeTruthy()
    expect(screen.getByText("93.20%")).toBeTruthy()
    expect(screen.getByText("91.80%")).toBeTruthy()
    expect(screen.getByText("92.50%")).toBeTruthy()
  })

  it("displays confusion matrix values", () => {
    render(<ModelMetrics {...mockProps} />)
    const confusionTab = screen.getByText("Confusion Matrix")
    fireEvent.click(confusionTab)
    expect(screen.getByText("1,850")).toBeTruthy()
    expect(screen.getByText("9,520")).toBeTruthy()
    expect(screen.getByText("480")).toBeTruthy()
    expect(screen.getByText("150")).toBeTruthy()
  })

  it("shows additional metrics (ROC AUC, MCC)", () => {
    render(<ModelMetrics {...mockProps} />)
    expect(screen.getByText("97.50%")).toBeTruthy()
    expect(screen.getByText("0.856")).toBeTruthy()
  })

  it("renders class-wise metrics table", () => {
    render(<ModelMetrics {...mockProps} />)
    const classwiseTab = screen.getByText("Class-wise Metrics")
    fireEvent.click(classwiseTab)
    expect(screen.getByText("Legitimate")).toBeTruthy()
    expect(screen.getByText("Fraudulent")).toBeTruthy()
  })

  it("displays metric trends over time", () => {
    render(<ModelMetrics {...mockProps} />)
    const trendsTab = screen.getByText("Trends")
    fireEvent.click(trendsTab)
    expect(screen.getByText("Metric Trends Over Time")).toBeTruthy()
  })

  it("shows threshold analysis", () => {
    render(<ModelMetrics {...mockProps} />)
    const thresholdTab = screen.getByText("Threshold Analysis")
    fireEvent.click(thresholdTab)
    expect(screen.getByText("Decision Threshold Analysis")).toBeTruthy()
  })

  it("calls onRefresh when refresh button is clicked", () => {
    const mockRefresh = jest.fn()
    render(<ModelMetrics {...mockProps} onRefresh={mockRefresh} />)
    const refreshButton = screen.getByText("Refresh")
    fireEvent.click(refreshButton)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it("calls onExport when export button is clicked", () => {
    const mockExport = jest.fn()
    render(<ModelMetrics {...mockProps} onExport={mockExport} />)
    const exportButton = screen.getByText("Export Report")
    fireEvent.click(exportButton)
    expect(mockExport).toHaveBeenCalledTimes(1)
  })
})
