describe('Angular App E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForAngular()
  })

  it('should display the app', () => {
    cy.get('app-root').should('be.visible')
  })

  it('should have a title', () => {
    cy.title().should('not.be.empty')
  })

  it('should load without errors', () => {
    cy.get('body').should('be.visible')
    cy.get('app-root').should('be.visible')
  })
})
