import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ComplianceBadges } from "@/components/energy/compliance-badges"

describe("ComplianceBadges", () => {
  const mockCertifications = [
    {
      id: 'leed',
      name: 'LEED',
      level: 'Gold',
      status: 'certified' as const,
      score: 65,
      maxScore: 110,
      achievedDate: '2023-01-15',
      expiryDate: '2028-01-15',
      certificationBody: 'U.S. Green Building Council',
      description: 'Leadership in Energy and Environmental Design',
      benefits: [
        'Reduced operating costs',
        'Improved occupant health',
        'Enhanced building value'
      ],
      requirements: [
        {
          category: 'Energy Performance',
          requirement: 'Achieve 20% energy cost savings',
          status: 'met' as const,
          currentValue: 25,
          requiredValue: 20,
          unit: '%'
        },
        {
          category: 'Water Efficiency',
          requirement: 'Reduce water use by 30%',
          status: 'met' as const,
          currentValue: 35,
          requiredValue: 30,
          unit: '%'
        }
      ],
      documentationUrl: 'https://example.com/leed-docs',
      applicationUrl: 'https://example.com/leed-apply'
    },
    {
      id: 'energy-star',
      name: 'ENERGY STAR',
      level: 'Certified',
      status: 'eligible' as const,
      score: 80,
      maxScore: 100,
      certificationBody: 'U.S. EPA',
      description: 'Energy efficiency certification program',
      benefits: [
        'Lower energy bills',
        'Federal tax credits',
        'Market recognition'
      ],
      requirements: [
        {
          category: 'Energy Score',
          requirement: 'Achieve score of 75 or higher',
          status: 'met' as const,
          currentValue: 80,
          requiredValue: 75,
          unit: 'score'
        },
        {
          category: 'Documentation',
          requirement: 'Submit 12 months of energy data',
          status: 'in-progress' as const
        }
      ],
      nextSteps: [
        'Complete energy data submission',
        'Schedule professional verification',
        'Submit application and fee'
      ],
      applicationUrl: 'https://example.com/energy-star-apply'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders compliance badges component", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText("Energy Certifications")).toBeTruthy()
  })

  it("displays all certification cards", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText("LEED")).toBeTruthy()
    expect(screen.getByText("ENERGY STAR")).toBeTruthy()
  })

  it("shows certification status badges", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText("certified")).toBeTruthy()
    expect(screen.getByText("eligible")).toBeTruthy()
  })

  it("displays certification levels", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText("Gold")).toBeTruthy()
    expect(screen.getByText("Certified")).toBeTruthy()
  })

  it("selects certification when card is clicked", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    const energyStarCard = screen.getAllByText("ENERGY STAR")[0]
    fireEvent.click(energyStarCard)

    waitFor(() => {
      expect(screen.getByText("Energy efficiency certification program")).toBeTruthy()
    })
  })

  it("displays certification score and progress", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText(/65 \/ 110/i)).toBeTruthy()
  })

  it("shows requirements checklist", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    expect(screen.getByText("Requirements Checklist")).toBeTruthy()
    expect(screen.getByText(/Energy Performance/i)).toBeTruthy()
  })

  it("displays requirement status icons", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    const metRequirements = screen.getAllByText(/Achieve 20% energy cost savings/i)
    expect(metRequirements.length).toBeGreaterThan(0)
  })

  it("shows next steps for eligible certifications", () => {
    render(<ComplianceBadges certifications={mockCertifications} />)
    const energyStarCard = screen.getAllByText("ENERGY STAR")[0]
    fireEvent.click(energyStarCard)

    waitFor(() => {
      expect(screen.getByText("Next Steps to Achieve Certification")).toBeTruthy()
    })
  })

  it("calls onApply when apply button is clicked for eligible certification", () => {
    const mockApply = jest.fn()
    render(<ComplianceBadges certifications={mockCertifications} onApply={mockApply} />)

    const energyStarCard = screen.getAllByText("ENERGY STAR")[0]
    fireEvent.click(energyStarCard)

    waitFor(() => {
      const applyButton = screen.getByText(/Apply for Certification/i)
      fireEvent.click(applyButton)
      expect(mockApply).toHaveBeenCalledWith('energy-star')
    })
  })
})
