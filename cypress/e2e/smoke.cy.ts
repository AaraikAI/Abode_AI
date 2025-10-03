describe("AbodeAI landing", () => {
  it("loads hero section", () => {
    cy.visit("/")
    cy.contains("Enterprise AI for architecture").should("be.visible")
    cy.get("nav").should("exist")
  })
})
