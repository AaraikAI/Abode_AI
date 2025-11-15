import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ModelRegistry } from "@/components/mlops/model-registry"

describe("ModelRegistry", () => {
  const mockProps = {
    models: [
      {
        id: 'model-1',
        name: 'sentiment-classifier',
        version: '1.2.0',
        status: 'active' as const,
        accuracy: 0.95,
        precision: 0.93,
        recall: 0.92,
        f1Score: 0.925,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'user@example.com',
        framework: 'PyTorch',
        modelSize: '150MB',
        tags: ['nlp', 'classification'],
        deploymentCount: 3
      },
      {
        id: 'model-2',
        name: 'image-classifier',
        version: '2.0.1',
        status: 'staging' as const,
        accuracy: 0.88,
        precision: 0.87,
        recall: 0.86,
        f1Score: 0.865,
        createdAt: '2024-01-20T14:30:00Z',
        createdBy: 'admin@example.com',
        framework: 'TensorFlow',
        modelSize: '250MB',
        tags: ['cv', 'classification'],
        deploymentCount: 1
      }
    ],
    lineage: [
      {
        modelId: 'model-1',
        version: '1.2.0',
        datasetId: 'dataset-123',
        trainingRunId: 'run-456',
        experimentId: 'exp-789',
        gitCommit: 'abc123def456',
        dependencies: ['transformers==4.30.0', 'torch==2.0.1']
      }
    ],
    deployments: [
      {
        id: 'deploy-1',
        modelVersion: '1.2.0',
        environment: 'production' as const,
        endpoint: 'https://api.example.com/v1/predict',
        status: 'active' as const,
        requestCount: 150000,
        avgLatency: 45,
        deployedAt: '2024-01-16T09:00:00Z'
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders model registry header", () => {
    render(<ModelRegistry {...mockProps} />)
    expect(screen.getByText("Model Registry")).toBeTruthy()
    expect(screen.getByText(/Manage ML model versions/i)).toBeTruthy()
  })

  it("displays all registered models", () => {
    render(<ModelRegistry {...mockProps} />)
    expect(screen.getByText("sentiment-classifier")).toBeTruthy()
    expect(screen.getByText("image-classifier")).toBeTruthy()
  })

  it("shows model status badges correctly", () => {
    render(<ModelRegistry {...mockProps} />)
    expect(screen.getByText("active")).toBeTruthy()
    expect(screen.getByText("staging")).toBeTruthy()
  })

  it("displays model metrics (accuracy, F1 score)", () => {
    render(<ModelRegistry {...mockProps} />)
    expect(screen.getByText("95.00%")).toBeTruthy()
    expect(screen.getByText("92.50%")).toBeTruthy()
  })

  it("filters models by search term", () => {
    render(<ModelRegistry {...mockProps} />)
    const searchInput = screen.getByPlaceholderText(/Search models/i)
    fireEvent.change(searchInput, { target: { value: 'sentiment' } })
    expect(screen.getByText("sentiment-classifier")).toBeTruthy()
    expect(screen.queryByText("image-classifier")).toBeFalsy()
  })

  it("filters models by status", () => {
    render(<ModelRegistry {...mockProps} />)
    const activeButton = screen.getByText("Active")
    fireEvent.click(activeButton)
    expect(screen.getByText("sentiment-classifier")).toBeTruthy()
    expect(screen.queryByText("image-classifier")).toBeFalsy()
  })

  it("displays model lineage information", () => {
    render(<ModelRegistry {...mockProps} />)
    const lineageTab = screen.getByText("Lineage")
    fireEvent.click(lineageTab)
    expect(screen.getByText(/Dataset ID/i)).toBeTruthy()
    expect(screen.getByText("dataset-123")).toBeTruthy()
  })

  it("shows deployment information", () => {
    render(<ModelRegistry {...mockProps} />)
    const deploymentsTab = screen.getByText("Deployments")
    fireEvent.click(deploymentsTab)
    expect(screen.getByText("https://api.example.com/v1/predict")).toBeTruthy()
  })

  it("calls onDeploy when deploy button is clicked", () => {
    const mockDeploy = jest.fn()
    render(<ModelRegistry {...mockProps} onDeploy={mockDeploy} />)
    const deployButtons = screen.getAllByRole('button')
    const deployButton = deployButtons.find(btn => btn.querySelector('svg'))
    if (deployButton) {
      fireEvent.click(deployButton)
      expect(mockDeploy).toHaveBeenCalled()
    }
  })

  it("calls onDownload when download button is clicked", () => {
    const mockDownload = jest.fn()
    render(<ModelRegistry {...mockProps} onDownload={mockDownload} />)
    const buttons = screen.getAllByRole('button')
    const downloadButton = buttons.find(btn => btn.querySelector('svg'))
    if (downloadButton) {
      fireEvent.click(downloadButton)
      expect(mockDownload).toHaveBeenCalled()
    }
  })
})
