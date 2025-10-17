// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to wait for Angular to be ready
       * @example cy.waitForAngular()
       */
      waitForAngular(): Chainable<void>
      
      /**
       * Custom command to navigate to a specific route
       * @example cy.navigateToRoute('/dashboard')
       */
      navigateToRoute(route: string): Chainable<void>
    }
  }
}

// Custom command to select by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

// Custom command to wait for Angular
Cypress.Commands.add('waitForAngular', () => {
  cy.get('app-root').should('be.visible')
  cy.wait(500) // Small delay for Angular components to initialize
})

// Custom command to navigate to routes
Cypress.Commands.add('navigateToRoute', (route: string) => {
  cy.visit(route)
  cy.waitForAngular()
})