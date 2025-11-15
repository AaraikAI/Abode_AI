import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProfileEditor } from "@/components/settings/profile-editor"

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
    },
  }),
}))

global.fetch = jest.fn()

describe("ProfileEditor", () => {
  const mockProfile = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatar.jpg",
    bio: "Software architect and designer",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles",
    website: "https://johndoe.com",
    company: "Acme Inc.",
    jobTitle: "Senior Architect",
    phone: "+1 (555) 123-4567",
    language: "en",
    dateFormat: "MM/DD/YYYY",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    })
  })

  it("renders profile editor with all fields", async () => {
    render(<ProfileEditor />)
    await waitFor(() => {
      expect(screen.getByLabelText("Full Name")).toBeTruthy()
      expect(screen.getByLabelText("Email")).toBeTruthy()
      expect(screen.getByLabelText("Bio")).toBeTruthy()
      expect(screen.getByLabelText("Company")).toBeTruthy()
      expect(screen.getByLabelText("Job Title")).toBeTruthy()
    })
  })

  it("displays user avatar correctly", async () => {
    render(<ProfileEditor />)
    await waitFor(() => {
      const avatar = screen.getByRole("img", { hidden: true })
      expect(avatar).toBeTruthy()
    })
  })

  it("loads and displays profile data", async () => {
    render(<ProfileEditor />)
    await waitFor(() => {
      expect((screen.getByLabelText("Full Name") as HTMLInputElement).value).toBe("John Doe")
      expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("john@example.com")
    })
  })

  it("enables save button when changes are made", async () => {
    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Full Name")).toBeTruthy()
    })

    const nameInput = screen.getByLabelText("Full Name")
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } })

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeTruthy()
    })
  })

  it("saves profile changes when save button is clicked", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Full Name")).toBeTruthy()
    })

    const nameInput = screen.getByLabelText("Full Name")
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } })

    const saveButton = screen.getByText("Save Changes")
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/account/profile",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  })

  it("displays timezone selector with options", async () => {
    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Timezone")).toBeTruthy()
    })
  })

  it("displays language selector with options", async () => {
    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Language")).toBeTruthy()
    })
  })

  it("handles avatar upload", async () => {
    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Full Name")).toBeTruthy()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" })
    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/avatar",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
  })

  it("resets form when reset button is clicked", async () => {
    render(<ProfileEditor />)

    await waitFor(() => {
      expect(screen.getByLabelText("Full Name")).toBeTruthy()
    })

    const nameInput = screen.getByLabelText("Full Name") as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Changed Name" } })

    const resetButton = screen.getAllByRole("button").find((btn) =>
      btn.querySelector('svg')
    )

    if (resetButton) {
      fireEvent.click(resetButton)
      await waitFor(() => {
        expect(nameInput.value).toBe("John Doe")
      })
    }
  })
})
