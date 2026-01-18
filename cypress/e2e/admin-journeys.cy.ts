describe('Admin User Journeys', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
  })

  describe('Journey 1: Admin Views Analytics', () => {
    it('views platform analytics', () => {
      // Sign in as admin
      cy.visit('/admin/dashboard')

      // 1. Sign in as admin
      cy.url().should('include', '/admin')

      // 2. View dashboard
      cy.contains('Admin Dashboard')

      // 3. Check user metrics
      cy.contains('Total Users')
      cy.contains('Total Patients')
      cy.contains('Total Doctors')

      // 4. Check appointment metrics
      cy.contains('Total Appointments')
      cy.contains('Completed Appointments')

      // 5. Check revenue metrics
      cy.contains('Total Revenue')
      cy.contains('Average Transaction')

      // 6. Filter by date range
      cy.get('select[name="period"]').select('30d')

      // 7. Export data
      cy.contains('Export').click()
    })
  })

  describe('Journey 2: Admin Verifies Doctor', () => {
    it('verifies doctor license', () => {
      // Sign in as admin
      cy.visit('/admin/doctors')

      // 1. Sign in as admin
      cy.url().should('include', '/admin')

      // 2. Navigate to Doctors
      cy.contains('Doctors').click()

      // 3. View pending verifications
      cy.contains('Pending Verifications')
      cy.get('button:contains("Verify")').first().click()

      // 4. Review doctor license
      cy.contains('License Information')
      cy.contains('View License').click()

      // 5. Approve/reject verification
      cy.contains('Approve').click()
      cy.contains('Verification approved')

      // 6. Doctor receives notification
      // (Would need to check notification system)
    })
  })

  describe('Journey 3: Admin Manages Appointments', () => {
    it('manages all appointments', () => {
      // Sign in as admin
      cy.visit('/admin/appointments')

      // 1. Sign in as admin
      cy.url().should('include', '/admin')

      // 2. View all appointments
      cy.contains('All Appointments')

      // 3. Filter by status/date
      cy.get('select[name="status"]').select('scheduled')
      cy.get('input[type="date"]').type('2024-01-01')

      // 4. View appointment details
      cy.contains('View Details').first().click()
      cy.contains('Appointment Details')

      // 5. Cancel appointment (if needed)
      cy.contains('Cancel Appointment').click()
      cy.contains('Confirm Cancel').click()

      // 6. View audit logs
      cy.contains('Audit Logs').click()
      cy.contains('Audit Log')
    })
  })

  describe('Journey 4: Admin Manages System Settings', () => {
    it('updates system settings', () => {
      // Sign in as admin
      cy.visit('/admin/settings')

      // 1. Sign in as admin
      cy.url().should('include', '/admin')

      // 2. Navigate to Settings
      cy.contains('Settings').click()

      // 3. Update consultation duration
      cy.contains('Consultation Duration').click()
      cy.get('input[name="duration"]').clear().type('45')
      cy.contains('Save').click()

      // 4. Update consultation price
      cy.contains('Consultation Price').click()
      cy.get('input[name="price"]').clear().type('25000')
      cy.contains('Save').click()

      // 5. Verify changes applied
      cy.contains('Settings updated successfully')
    })
  })
})
