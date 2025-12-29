describe('Authentication', () => {
  it('should redirect to sign in when not authenticated', () => {
    cy.visit('/patient')
    cy.url().should('include', '/auth/signin')
  })

  it('should display sign in page', () => {
    cy.visit('/auth/signin')
    cy.contains('Care Haven')
    cy.contains('Continue with Google')
  })
})

