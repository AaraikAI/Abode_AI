import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ScheduleOfValues, ScheduleItem } from "@/components/cost/schedule-of-values"

describe("ScheduleOfValues", () => {
  const mockItems: ScheduleItem[] = [
    {
      id: "1",
      description: "Site Preparation",
      scheduledValue: 10000,
      percentComplete: 100,
      completedValue: 10000,
      previouslyBilled: 0,
      currentBilling: 10000,
      retainage: 1000,
      retainagePercent: 10,
      status: "completed",
    },
    {
      id: "2",
      description: "Foundation Work",
      scheduledValue: 25000,
      percentComplete: 50,
      completedValue: 12500,
      previouslyBilled: 0,
      currentBilling: 12500,
      retainage: 1250,
      retainagePercent: 10,
      status: "in-progress",
    },
  ]

  const mockOnChange = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    items: mockItems,
    totalContractValue: 100000,
    onItemsChange: mockOnChange,
    editable: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders schedule of values header", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Schedule of Values")).toBeTruthy()
  })

  it("displays contract value summary card", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Contract Value")).toBeTruthy()
  })

  it("shows completed value summary card", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Completed Value")).toBeTruthy()
  })

  it("displays current billing summary card", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Current Billing")).toBeTruthy()
  })

  it("shows total retainage summary card", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Total Retainage")).toBeTruthy()
  })

  it("displays overall progress section", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Overall Progress")).toBeTruthy()
  })

  it("shows line items table", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Line Items")).toBeTruthy()
  })

  it("displays schedule items in table", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Site Preparation")).toBeTruthy()
    expect(screen.getByText("Foundation Work")).toBeTruthy()
  })

  it("shows add line item button when editable", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Add Line Item")).toBeTruthy()
  })

  it("displays payment summary section", () => {
    render(<ScheduleOfValues {...defaultProps} />)
    expect(screen.getByText("Payment Summary")).toBeTruthy()
  })
})
