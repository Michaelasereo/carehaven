describe('Appointments', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
  })

  it('should display appointments page', () => {
    cy.visit('/patient/appointments')
    cy.contains('Upcoming Appointments')
  })
})

