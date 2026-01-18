describe('Patient User Journeys', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
  })

  describe('Journey 1: New Patient Registration & First Appointment', () => {
    it('completes full registration and booking flow', () => {
      // 1. Visit landing page
      cy.visit('/')
      cy.contains('Care Haven')

      // 2. Click "Get Started"
      cy.contains('Get Started').click()

      // 3. Sign up with email/password
      cy.url().should('include', '/auth/signin')
      cy.contains('Sign up').click()
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('ValidPass123!')
      cy.get('input[type="password"]').last().type('ValidPass123!')
      cy.contains('Create Account').click()

      // 4. Verify email (mock)
      cy.url().should('include', '/auth/verify-email')

      // 5. Complete profile
      cy.url().should('include', '/complete-profile')
      cy.get('input[name="full_name"]').type('John Patient')
      cy.get('input[name="phone"]').type('+2348012345678')
      cy.contains('Complete Profile').click()

      // 6. View dashboard
      cy.url().should('include', '/patient')
      cy.contains('Dashboard')

      // 7. Book appointment
      cy.contains('Book Appointment').click()
      // Fill appointment form...
      // Select doctor...
      // Select date/time...
      // Complete payment...

      // 8. Receive confirmation
      cy.contains('Appointment confirmed')

      // 9. Join consultation (at scheduled time)
      // This would require time manipulation or waiting

      // 10. View session notes after consultation
      cy.visit('/patient/sessions')
      cy.contains('Session Notes')
    })
  })

  describe('Journey 2: Existing Patient Books Follow-Up', () => {
    it('books follow-up appointment', () => {
      // 1. Sign in
      cy.visit('/auth/signin')
      cy.get('input[type="email"]').type('existing@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.contains('Sign In').click()

      // 2. View dashboard
      cy.url().should('include', '/patient')
      cy.contains('Dashboard')

      // 3. Book new appointment
      cy.contains('Book Appointment').click()

      // 4. Select previous doctor
      cy.contains('Dr. Previous').click()

      // 5. Complete payment
      // Payment flow...

      // 6. View appointment in list
      cy.visit('/patient/appointments')
      cy.contains('Upcoming Appointments')
    })
  })

  describe('Journey 3: Patient Views Medical Records', () => {
    it('views all medical records', () => {
      // Sign in as patient
      cy.visit('/auth/signin')
      // ... sign in steps

      // 1. Sign in
      cy.url().should('include', '/patient')

      // 2. Navigate to Sessions
      cy.contains('Sessions').click()

      // 3. View session details
      cy.contains('View Details').first().click()

      // 4. View prescriptions
      cy.contains('Prescriptions').click()

      // 5. View investigations
      cy.contains('Investigations').click()

      // 6. Upload investigation results
      cy.contains('Upload Results').click()
      // Upload file...
    })
  })

  describe('Journey 4: Patient Reschedules Appointment', () => {
    it('reschedules appointment successfully', () => {
      // Sign in
      cy.visit('/patient/appointments')

      // 1. Sign in
      cy.url().should('include', '/patient/appointments')

      // 2. View appointments
      cy.contains('Upcoming Appointments')

      // 3. Click "Reschedule"
      cy.contains('Reschedule').first().click()

      // 4. Select new date/time
      cy.get('input[type="date"]').clear().type('2024-12-25')
      cy.get('select').select('10:00')

      // 5. Confirm reschedule
      cy.contains('Confirm Reschedule').click()

      // 6. Receive notification
      cy.contains('Appointment rescheduled')
    })
  })

  describe('Journey 5: Patient Cancels Appointment', () => {
    it('cancels appointment successfully', () => {
      // Sign in
      cy.visit('/patient/appointments')

      // 1. Sign in
      cy.url().should('include', '/patient/appointments')

      // 2. View appointments
      cy.contains('Upcoming Appointments')

      // 3. Click "Cancel"
      cy.contains('Cancel').first().click()

      // 4. Confirm cancellation
      cy.contains('Confirm Cancel').click()

      // 5. Receive refund (if applicable)
      // Check refund status...

      // 6. Receive notification
      cy.contains('Appointment cancelled')
    })
  })
})
