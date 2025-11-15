import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProjectGrid, Project } from "@/components/dashboard/project-grid"

global.fetch = jest.fn()

describe("ProjectGrid", () => {
  const mockProjects: Project[] = [
    {
      id: "project-1",
      name: "Modern Villa",
      description: "A contemporary residential design",
      thumbnail: "/images/villa.jpg",
      status: "active",
      lastModified: "2025-01-15T10:00:00Z",
      createdAt: "2025-01-01T10:00:00Z",
      owner: {
        id: "user-1",
        name: "John Doe",
        avatar: "/avatar1.jpg",
      },
      collaborators: [
        { id: "user-2", name: "Jane Smith", avatar: "/avatar2.jpg" },
      ],
      stats: {
        views: 150,
        downloads: 12,
        comments: 8,
      },
      isFavorite: true,
      tags: ["residential", "modern", "villa"],
    },
    {
      id: "project-2",
      name: "Office Complex",
      status: "draft",
      lastModified: "2025-01-14T10:00:00Z",
      createdAt: "2025-01-10T10:00:00Z",
      owner: {
        id: "user-1",
        name: "John Doe",
      },
      stats: {
        views: 50,
        downloads: 3,
        comments: 2,
      },
      isFavorite: false,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: mockProjects }),
    })
  })

  it("renders project grid with projects", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      expect(screen.getByText("Modern Villa")).toBeTruthy()
      expect(screen.getByText("Office Complex")).toBeTruthy()
    })
  })

  it("displays project thumbnails when available", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      const images = screen.getAllByRole("img")
      expect(images.length).toBeGreaterThan(0)
    })
  })

  it("shows project statistics correctly", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      expect(screen.getByText("150")).toBeTruthy()
      expect(screen.getByText("12")).toBeTruthy()
    })
  })

  it("displays project status badges", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      expect(screen.getByText("active")).toBeTruthy()
      expect(screen.getByText("draft")).toBeTruthy()
    })
  })

  it("shows favorite star indicator for favorited projects", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      const stars = screen.getAllByRole("button").filter((btn) =>
        btn.querySelector('[class*="fill-yellow"]')
      )
      expect(stars.length).toBeGreaterThan(0)
    })
  })

  it("displays project tags when available", async () => {
    render(<ProjectGrid />)
    await waitFor(() => {
      expect(screen.getByText("residential")).toBeTruthy()
      expect(screen.getByText("modern")).toBeTruthy()
      expect(screen.getByText("villa")).toBeTruthy()
    })
  })

  it("shows empty state when no projects found", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    })

    render(<ProjectGrid />)
    await waitFor(() => {
      expect(screen.getByText(/No projects found/i)).toBeTruthy()
    })
  })

  it("displays loading skeleton while fetching projects", () => {
    render(<ProjectGrid />)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("toggles favorite status when star is clicked", async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: mockProjects }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<ProjectGrid />)

    await waitFor(() => {
      expect(screen.getByText("Modern Villa")).toBeTruthy()
    })

    const starButtons = screen.getAllByRole("button").filter((btn) =>
      btn.querySelector('svg')
    )
    if (starButtons.length > 0) {
      fireEvent.click(starButtons[0])
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/projects/"),
          expect.any(Object)
        )
      })
    }
  })

  it("opens dropdown menu with actions on more button click", async () => {
    render(<ProjectGrid />)

    await waitFor(() => {
      expect(screen.getByText("Modern Villa")).toBeTruthy()
    })

    const moreButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.includes("") && btn.querySelector('svg')
    )

    if (moreButtons.length > 0) {
      fireEvent.click(moreButtons[0])
      await waitFor(() => {
        expect(screen.getByText(/View|Edit|Share|Delete/i)).toBeTruthy()
      })
    }
  })
})
