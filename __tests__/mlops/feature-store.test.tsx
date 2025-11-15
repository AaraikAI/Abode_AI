import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FeatureStore } from "@/components/mlops/feature-store"

describe("FeatureStore", () => {
  const mockProps = {
    features: [
      {
        id: 'feature-1',
        name: 'user_age_normalized',
        version: '1.0.0',
        dataType: 'numerical' as const,
        status: 'active' as const,
        description: 'Normalized user age (0-1 scale)',
        source: 'users_table',
        transformation: 'min-max normalization',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'data-engineer@example.com',
        lastModified: '2024-01-15T14:30:00Z',
        usageCount: 125,
        tags: ['user', 'demographic']
      },
      {
        id: 'feature-2',
        name: 'product_category_encoded',
        version: '2.1.0',
        dataType: 'categorical' as const,
        status: 'active' as const,
        description: 'One-hot encoded product categories',
        source: 'products_table',
        transformation: 'one-hot encoding',
        createdAt: '2024-01-12T09:00:00Z',
        createdBy: 'ml-engineer@example.com',
        lastModified: '2024-01-18T11:00:00Z',
        usageCount: 98,
        tags: ['product', 'categorical']
      }
    ],
    featureGroups: [
      {
        id: 'group-1',
        name: 'User Demographics',
        description: 'Demographic features for user profiling',
        features: ['feature-1'],
        version: '1.0.0',
        status: 'active' as const,
        createdAt: '2024-01-10T10:00:00Z'
      }
    ],
    transformations: [
      {
        id: 'transform-1',
        name: 'Normalize Age',
        type: 'normalization' as const,
        description: 'Min-max normalization of user age',
        inputFeatures: ['user_age'],
        outputFeature: 'user_age_normalized',
        code: 'def normalize(x): return (x - min) / (max - min)',
        parameters: { min: 0, max: 100 }
      }
    ],
    featureStats: [
      {
        featureId: 'feature-1',
        mean: 0.45,
        median: 0.42,
        stdDev: 0.18,
        min: 0.0,
        max: 1.0,
        nullCount: 12,
        uniqueCount: 100,
        distribution: [
          { value: '0.0-0.2', count: 250 },
          { value: '0.2-0.4', count: 400 },
          { value: '0.4-0.6', count: 500 },
          { value: '0.6-0.8', count: 350 },
          { value: '0.8-1.0', count: 200 }
        ]
      }
    ],
    usageHistory: [
      {
        featureId: 'feature-1',
        timestamp: '2024-01-15',
        modelId: 'model-1',
        modelName: 'user-classifier',
        accessCount: 50
      },
      {
        featureId: 'feature-1',
        timestamp: '2024-01-16',
        modelId: 'model-1',
        modelName: 'user-classifier',
        accessCount: 75
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders feature store header", () => {
    render(<FeatureStore {...mockProps} />)
    expect(screen.getByText("Feature Store")).toBeTruthy()
    expect(screen.getByText(/Manage feature engineering pipeline/i)).toBeTruthy()
  })

  it("displays feature statistics cards", () => {
    render(<FeatureStore {...mockProps} />)
    expect(screen.getByText("Total Features")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
    expect(screen.getByText("Feature Groups")).toBeTruthy()
    expect(screen.getByText("Transformations")).toBeTruthy()
  })

  it("shows all features in catalog", () => {
    render(<FeatureStore {...mockProps} />)
    expect(screen.getByText("user_age_normalized")).toBeTruthy()
    expect(screen.getByText("product_category_encoded")).toBeTruthy()
  })

  it("displays feature data types", () => {
    render(<FeatureStore {...mockProps} />)
    expect(screen.getByText(/numerical/i)).toBeTruthy()
    expect(screen.getByText(/categorical/i)).toBeTruthy()
  })

  it("filters features by search term", () => {
    render(<FeatureStore {...mockProps} />)
    const searchInput = screen.getByPlaceholderText(/Search features/i)
    fireEvent.change(searchInput, { target: { value: 'age' } })
    expect(screen.getByText("user_age_normalized")).toBeTruthy()
    expect(screen.queryByText("product_category_encoded")).toBeFalsy()
  })

  it("filters features by status", () => {
    render(<FeatureStore {...mockProps} />)
    const activeButton = screen.getByText("Active")
    fireEvent.click(activeButton)
    expect(screen.getByText("user_age_normalized")).toBeTruthy()
  })

  it("displays feature groups", () => {
    render(<FeatureStore {...mockProps} />)
    const groupsTab = screen.getByText("Feature Groups")
    fireEvent.click(groupsTab)
    expect(screen.getByText("User Demographics")).toBeTruthy()
  })

  it("shows transformations", () => {
    render(<FeatureStore {...mockProps} />)
    const transformTab = screen.getByText("Transformations")
    fireEvent.click(transformTab)
    expect(screen.getByText("Normalize Age")).toBeTruthy()
    expect(screen.getByText("normalization")).toBeTruthy()
  })

  it("displays usage analytics", () => {
    render(<FeatureStore {...mockProps} />)
    const usageTab = screen.getByText("Usage Analytics")
    fireEvent.click(usageTab)
    expect(screen.getByText("Top Features by Usage")).toBeTruthy()
  })

  it("calls onCreateFeature when create button is clicked", () => {
    const mockCreate = jest.fn()
    render(<FeatureStore {...mockProps} onCreateFeature={mockCreate} />)
    const createButton = screen.getByText("Create Feature")
    fireEvent.click(createButton)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})
