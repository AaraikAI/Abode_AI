import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { OfflineSyncStatus, SyncStatus, SyncChange } from "@/components/mobile/offline-sync-status"

describe("OfflineSyncStatus", () => {
  const mockStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: new Date().toISOString(),
    pendingChanges: 3,
    failedChanges: 1,
    conflicts: 2,
    totalDataSize: 1000,
    syncedDataSize: 750
  }

  const mockChanges: SyncChange[] = [
    {
      id: "1",
      type: "create",
      entityType: "design",
      entityId: "design-1",
      entityName: "Floor Plan v2",
      timestamp: new Date().toISOString(),
      status: "pending"
    },
    {
      id: "2",
      type: "update",
      entityType: "project",
      entityId: "project-1",
      entityName: "House Renovation",
      timestamp: new Date().toISOString(),
      status: "syncing"
    },
    {
      id: "3",
      type: "delete",
      entityType: "file",
      entityId: "file-1",
      entityName: "old-blueprint.pdf",
      timestamp: new Date().toISOString(),
      status: "failed",
      error: "Network timeout",
      retryCount: 2
    }
  ]

  const mockOnSync = jest.fn()
  const mockOnRetryChange = jest.fn()
  const mockOnDiscardChange = jest.fn()

  const defaultProps = {
    status: mockStatus,
    changes: mockChanges,
    onSync: mockOnSync,
    onRetryChange: mockOnRetryChange,
    onDiscardChange: mockOnDiscardChange
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders sync status with online indicator", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Online")).toBeTruthy()
  })

  it("displays offline status when not connected", () => {
    const offlineStatus = { ...mockStatus, isOnline: false }
    render(<OfflineSyncStatus {...defaultProps} status={offlineStatus} />)
    expect(screen.getByText("Offline")).toBeTruthy()
  })

  it("shows sync now button", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Sync Now")).toBeTruthy()
  })

  it("displays pending changes count", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Pending")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows failed changes count", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Failed")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("displays conflicts count", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Conflicts")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("renders queued changes list", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText("Floor Plan v2")).toBeTruthy()
    expect(screen.getByText("House Renovation")).toBeTruthy()
    expect(screen.getByText("old-blueprint.pdf")).toBeTruthy()
  })

  it("shows all changes synced message when no changes", () => {
    render(<OfflineSyncStatus {...defaultProps} changes={[]} />)
    expect(screen.getByText("All changes synced")).toBeTruthy()
  })

  it("displays sync progress when syncing", () => {
    const syncingStatus = { ...mockStatus, isSyncing: true }
    render(<OfflineSyncStatus {...defaultProps} status={syncingStatus} />)
    expect(screen.getByText("Syncing...")).toBeTruthy()
  })

  it("shows last sync time", () => {
    render(<OfflineSyncStatus {...defaultProps} />)
    expect(screen.getByText(/Last synced:/)).toBeTruthy()
  })
})
