describe('Doctor User Journeys', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
  })

  describe('Journey 1: Doctor Onboarding', () => {
    it('completes doctor onboarding', () => {
      // 1. Sign up as doctor
      cy.visit('/auth/signup')
      cy.get('input[type="email"]').type('doctor@example.com')
      cy.get('input[type="password"]').first().type('ValidPass123!')
      cy.get('input[type="password"]').last().type('ValidPass123!')
      cy.contains('Create Account').click()

      // 2. Complete doctor profile
      cy.url().should('include', '/complete-profile')
      cy.get('input[name="full_name"]').type('Dr. Jane Doctor')
      cy.get('input[name="license_number"]').type('MD12345')
      cy.get('input[name="specialty"]').type('General Practice')
      cy.get('input[name="consultation_fee"]').type('20000')
      cy.contains('Complete Profile').click()

      // 3. Add license information
      // License upload...

      // 4. Set consultation fee
      // Already set in profile

      // 5. View dashboard
      cy.url().should('include', '/doctor')
      cy.contains('Dashboard')
    })
  })

  describe('Journey 2: Doctor Conducts Consultation', () => {
    it('completes consultation workflow', () => {
      // Sign in as doctor
      cy.visit('/doctor/appointments')

      // 1. Sign in
      cy.url().should('include', '/doctor')

      // 2. View upcoming appointments
      cy.contains('Upcoming Appointments')

      // 3. Click on appointment
      cy.contains('View Details').first().click()

      // 4. View patient details
      cy.contains('Patient Information')

      // 5. Join consultation
      cy.contains('Join Consultation').click()

      // 6. Create SOAP notes
      cy.contains('Add Notes').click()
      cy.get('textarea[name="subjective"]').type('Patient complains of headache')
      cy.get('textarea[name="objective"]').type('Blood pressure normal')
      cy.get('textarea[name="assessment"]').type('Migraine')
      cy.get('textarea[name="plan"]').type('Prescribe pain medication')
      cy.contains('Save Notes').click()

      // 7. Create prescription
      cy.contains('Create Prescription').click()
      // Fill prescription form...
      cy.contains('Save Prescription').click()

      // 8. Request investigation
      cy.contains('Request Investigation').click()
      // Fill investigation form...
      cy.contains('Request').click()

      // 9. Save all records
      cy.contains('All records saved')
    })
  })

  describe('Journey 3: Doctor Manages Patients', () => {
    it('manages patient information', () => {
      // Sign in as doctor
      cy.visit('/doctor/sessions')

      // 1. Sign in
      cy.url().should('include', '/doctor')

      // 2. Navigate to Clients
      cy.contains('Clients').click()

      // 3. Search for patient
      cy.get('input[placeholder*="Search"]').type('John Patient')

      // 4. View patient history
      cy.contains('John Patient').click()

      // 5. View previous consultations
      cy.contains('Sessions').click()
      cy.contains('Previous Consultations')

      // 6. View prescriptions
      cy.contains('Prescriptions').click()

      // 7. View investigations
      cy.contains('Investigations').click()
    })
  })

  describe('Journey 4: Doctor Sets Availability', () => {
    it('sets weekly availability', () => {
      // Sign in as doctor
      cy.visit('/doctor/settings')

      // 1. Sign in
      cy.url().should('include', '/doctor')

      // 2. Navigate to Settings
      cy.contains('Settings').click()

      // 3. Set weekly availability
      cy.contains('Availability').click()
      // Set Monday 9am-5pm
      cy.get('input[value="Monday"]').check()
      cy.get('input[name="start_time"]').type('09:00')
      cy.get('input[name="end_time"]').type('17:00')

      // 4. Block specific dates
      cy.contains('Block Dates').click()
      cy.get('input[type="date"]').type('2024-12-25')

      // 5. Save availability
      cy.contains('Save Availability').click()
      cy.contains('Availability saved')
    })
  })
})
