import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QuickActions } from "@/components/dashboard/quick-actions"

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

global.fetch = jest.fn()

describe("QuickActions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ project: { id: "new-project-123" } }),
    })
  })

  it("renders all default quick action buttons", () => {
    render(<QuickActions />)
    expect(screen.getByText("New Project")).toBeTruthy()
    expect(screen.getByText("Upload File")).toBeTruthy()
    expect(screen.getByText("Templates")).toBeTruthy()
    expect(screen.getByText("Invite Team")).toBeTruthy()
    expect(screen.getByText("AI Generate")).toBeTruthy()
    expect(screen.getByText("Import Data")).toBeTruthy()
  })

  it("hides templates button when showTemplates is false", () => {
    render(<QuickActions showTemplates={false} />)
    expect(screen.queryByText("Templates")).toBeNull()
  })

  it("displays custom actions when provided", () => {
    const customActions = [
      {
        id: "custom-1",
        label: "Custom Action",
        icon: <div>Icon</div>,
        onClick: jest.fn(),
      },
    ]
    render(<QuickActions customActions={customActions} />)
    expect(screen.getByText("Custom Action")).toBeTruthy()
  })

  it("opens new project dialog when New Project button is clicked", () => {
    render(<QuickActions />)
    const newProjectButton = screen.getByText("New Project")
    fireEvent.click(newProjectButton)
    expect(screen.getByText("Create New Project")).toBeTruthy()
    expect(screen.getByPlaceholderText("My Awesome Project")).toBeTruthy()
  })

  it("creates project with correct data when form is submitted", async () => {
    render(<QuickActions />)

    const newProjectButton = screen.getByText("New Project")
    fireEvent.click(newProjectButton)

    const nameInput = screen.getByPlaceholderText("My Awesome Project")
    const descriptionInput = screen.getByPlaceholderText("Describe your project...")

    fireEvent.change(nameInput, { target: { value: "Test Project" } })
    fireEvent.change(descriptionInput, { target: { value: "Test description" } })

    const createButton = screen.getByText("Create Project")
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Test Project"),
        })
      )
    })
  })

  it("opens upload dialog when Upload File button is clicked", () => {
    render(<QuickActions />)
    const uploadButton = screen.getByText("Upload File")
    fireEvent.click(uploadButton)
    expect(screen.getByText("Upload File", { selector: "h2" })).toBeTruthy()
    expect(screen.getByLabelText("Select File")).toBeTruthy()
  })

  it("validates project name before creating project", async () => {
    render(<QuickActions />)

    const newProjectButton = screen.getByText("New Project")
    fireEvent.click(newProjectButton)

    const createButton = screen.getByText("Create Project")
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it("calls onProjectCreated callback after successful creation", async () => {
    const onProjectCreated = jest.fn()
    render(<QuickActions onProjectCreated={onProjectCreated} />)

    const newProjectButton = screen.getByText("New Project")
    fireEvent.click(newProjectButton)

    const nameInput = screen.getByPlaceholderText("My Awesome Project")
    fireEvent.change(nameInput, { target: { value: "New Project" } })

    const createButton = screen.getByText("Create Project")
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(onProjectCreated).toHaveBeenCalledWith("new-project-123")
    })
  })

  it("navigates to templates page when Templates button is clicked", () => {
    render(<QuickActions />)
    const templatesButton = screen.getByText("Templates")
    fireEvent.click(templatesButton)
    expect(mockPush).toHaveBeenCalledWith("/templates")
  })

  it("shows template selector in new project dialog", () => {
    render(<QuickActions />)
    const newProjectButton = screen.getByText("New Project")
    fireEvent.click(newProjectButton)

    expect(screen.getByText("Template (optional)")).toBeTruthy()
    const templateSelector = screen.getByRole("combobox")
    expect(templateSelector).toBeTruthy()
  })

  it("accepts file upload and displays file info", async () => {
    render(<QuickActions />)

    const uploadButton = screen.getByText("Upload File")
    fireEvent.click(uploadButton)

    const fileInput = screen.getByLabelText("Select File") as HTMLInputElement
    const file = new File(["content"], "test.ifc", { type: "application/ifc" })

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/test.ifc/i)).toBeTruthy()
    })
  })
})
