import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeploymentPipeline } from "@/components/mlops/deployment-pipeline"

describe("DeploymentPipeline", () => {
  const mockProps = {
    currentDeployment: {
      id: 'deploy-123',
      modelName: 'sentiment-classifier',
      modelVersion: '2.1.0',
      environment: 'production' as const,
      status: 'in-progress' as const,
      strategy: 'canary' as const,
      createdAt: '2024-01-15T10:00:00Z',
      stages: [
        {
          id: 'stage-1',
          name: 'Build & Package',
          status: 'completed' as const,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:05:00Z',
          duration: '5m',
          checks: [
            { name: 'Docker build', status: 'passed' as const },
            { name: 'Security scan', status: 'passed' as const }
          ]
        },
        {
          id: 'stage-2',
          name: 'Deploy to Staging',
          status: 'running' as const,
          startTime: '2024-01-15T10:05:00Z',
          checks: [
            { name: 'Health check', status: 'pending' as const }
          ]
        },
        {
          id: 'stage-3',
          name: 'Production Rollout',
          status: 'pending' as const,
          checks: [
            { name: 'Canary analysis', status: 'pending' as const }
          ]
        }
      ],
      healthScore: 98,
      trafficPercentage: 10
    },
    deploymentHistory: [
      {
        id: 'deploy-122',
        modelName: 'sentiment-classifier',
        modelVersion: '2.0.0',
        environment: 'production' as const,
        status: 'completed' as const,
        strategy: 'blue-green' as const,
        createdAt: '2024-01-10T10:00:00Z',
        stages: [],
        healthScore: 95,
        trafficPercentage: 100
      }
    ],
    canaryConfig: {
      enabled: true,
      trafficPercentage: 10,
      duration: 30,
      successThreshold: 99,
      errorThreshold: 1
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders deployment pipeline header", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("Deployment Pipeline")).toBeTruthy()
    expect(screen.getByText(/Manage model deployments/i)).toBeTruthy()
  })

  it("displays current deployment information", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("sentiment-classifier v2.1.0")).toBeTruthy()
    expect(screen.getByText("in-progress")).toBeTruthy()
  })

  it("shows deployment strategy and environment", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("canary")).toBeTruthy()
    expect(screen.getByText("production")).toBeTruthy()
  })

  it("displays overall deployment progress", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("Overall Progress")).toBeTruthy()
    expect(screen.getByText("33%")).toBeTruthy()
  })

  it("shows health score and traffic percentage", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("98%")).toBeTruthy()
    expect(screen.getByText("10%")).toBeTruthy()
  })

  it("renders all deployment stages", () => {
    render(<DeploymentPipeline {...mockProps} />)
    expect(screen.getByText("Build & Package")).toBeTruthy()
    expect(screen.getByText("Deploy to Staging")).toBeTruthy()
    expect(screen.getByText("Production Rollout")).toBeTruthy()
  })

  it("displays canary configuration", () => {
    render(<DeploymentPipeline {...mockProps} />)
    const canaryTab = screen.getByText("Canary Config")
    fireEvent.click(canaryTab)
    expect(screen.getByText("Canary Deployment Configuration")).toBeTruthy()
    expect(screen.getByText("Enabled")).toBeTruthy()
  })

  it("shows deployment history", () => {
    render(<DeploymentPipeline {...mockProps} />)
    const historyTab = screen.getByText("History")
    fireEvent.click(historyTab)
    expect(screen.getByText("v2.0.0")).toBeTruthy()
    expect(screen.getByText("blue-green")).toBeTruthy()
  })

  it("calls onPause when pause button is clicked", () => {
    const mockPause = jest.fn()
    render(<DeploymentPipeline {...mockProps} onPause={mockPause} />)
    const pauseButton = screen.getByText("Pause")
    fireEvent.click(pauseButton)
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it("calls onRollback when rollback button is clicked", () => {
    const mockRollback = jest.fn()
    render(<DeploymentPipeline {...mockProps} onRollback={mockRollback} />)
    const rollbackButton = screen.getByText("Rollback")
    fireEvent.click(rollbackButton)
    expect(mockRollback).toHaveBeenCalledTimes(1)
  })
})
