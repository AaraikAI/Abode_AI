import { describe, expect, it } from "@jest/globals"
import { render, screen } from "@testing-library/react"

import { Hero } from "@/components/abode/hero"
import { heroStats } from "@/lib/abode-data"

describe("Hero", () => {
  it("renders primary headline", () => {
    render(<Hero stats={heroStats} />)
    const headline = screen.getByText(
      "Enterprise AI for architecture, from site plan to factory floor.",
      { exact: false }
    )
    expect(headline).toBeTruthy()
  })
})
