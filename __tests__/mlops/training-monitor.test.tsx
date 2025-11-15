import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TrainingMonitor } from "@/components/mlops/training-monitor"

describe("TrainingMonitor", () => {
  const mockProps = {
    trainingRun: {
      id: 'run-123',
      modelName: 'ResNet-50',
      status: 'running' as const,
      currentEpoch: 15,
      totalEpochs: 100,
      progress: 15,
      elapsedTime: '2h 30m',
      estimatedTimeRemaining: '14h 30m',
      startedAt: '2024-01-15T10:00:00Z',
      bestValLoss: 0.3245,
      currentLoss: 0.3567
    },
    metricsHistory: [
      {
        epoch: 1,
        trainLoss: 1.234,
        valLoss: 1.456,
        trainAccuracy: 0.65,
        valAccuracy: 0.62,
        learningRate: 0.001,
        timestamp: '2024-01-15T10:10:00Z'
      },
      {
        epoch: 2,
        trainLoss: 0.987,
        valLoss: 1.123,
        trainAccuracy: 0.72,
        valAccuracy: 0.68,
        learningRate: 0.001,
        timestamp: '2024-01-15T10:20:00Z'
      }
    ],
    gpuMetrics: [
      {
        gpuId: 0,
        utilization: 85,
        memoryUsed: 14,
        memoryTotal: 16,
        temperature: 72,
        powerUsage: 250
      }
    ],
    systemMetrics: {
      cpuUsage: 45,
      ramUsage: 68,
      diskUsage: 55,
      networkThroughput: 125
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders training monitor header", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("Training Monitor")).toBeTruthy()
    expect(screen.getByText(/Real-time monitoring/i)).toBeTruthy()
  })

  it("displays training run information", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("ResNet-50")).toBeTruthy()
    expect(screen.getByText(/Epoch 15 of 100/i)).toBeTruthy()
  })

  it("shows training progress bar", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("Training Progress")).toBeTruthy()
    expect(screen.getByText("15%")).toBeTruthy()
  })

  it("displays elapsed time and estimated time remaining", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("2h 30m")).toBeTruthy()
    expect(screen.getByText("14h 30m")).toBeTruthy()
  })

  it("shows current loss and best validation loss", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("0.3567")).toBeTruthy()
    expect(screen.getByText("0.3245")).toBeTruthy()
  })

  it("renders loss curves chart", () => {
    render(<TrainingMonitor {...mockProps} />)
    expect(screen.getByText("Loss Curves")).toBeTruthy()
    expect(screen.getByText(/Training vs validation loss/i)).toBeTruthy()
  })

  it("displays GPU metrics", () => {
    render(<TrainingMonitor {...mockProps} />)
    const gpuTab = screen.getByText("GPU Utilization")
    fireEvent.click(gpuTab)
    expect(screen.getByText("GPU 0")).toBeTruthy()
    expect(screen.getByText("85%")).toBeTruthy()
  })

  it("shows system resource usage", () => {
    render(<TrainingMonitor {...mockProps} />)
    const systemTab = screen.getByText("System Resources")
    fireEvent.click(systemTab)
    expect(screen.getByText("CPU Usage")).toBeTruthy()
    expect(screen.getByText("45%")).toBeTruthy()
  })

  it("calls onPause when pause button is clicked", () => {
    const mockPause = jest.fn()
    render(<TrainingMonitor {...mockProps} onPause={mockPause} />)
    const pauseButton = screen.getByText("Pause")
    fireEvent.click(pauseButton)
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it("calls onStop when stop button is clicked", () => {
    const mockStop = jest.fn()
    render(<TrainingMonitor {...mockProps} onStop={mockStop} />)
    const stopButton = screen.getByText("Stop")
    fireEvent.click(stopButton)
    expect(mockStop).toHaveBeenCalledTimes(1)
  })
})
