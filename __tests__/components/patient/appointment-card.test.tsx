import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppointmentCard } from '@/components/patient/appointment-card'
import { createMockAppointment } from '@/__tests__/utils/test-utils'

// Mock child components
jest.mock('@/components/patient/join-consultation-button', () => ({
  JoinConsultationButton: ({ appointmentId }: { appointmentId: string }) => (
    <button>Join Consultation</button>
  ),
}))

jest.mock('@/components/patient/reschedule-appointment-dialog', () => ({
  RescheduleAppointmentDialog: ({ onClose }: { onClose: () => void }) => (
    <div>
      <button onClick={onClose}>Close Reschedule</button>
    </div>
  ),
}))

jest.mock('@/components/patient/cancel-appointment-dialog', () => ({
  CancelAppointmentDialog: ({ onClose }: { onClose: () => void }) => (
    <div>
      <button onClick={onClose}>Close Cancel</button>
    </div>
  ),
}))

describe('AppointmentCard', () => {
  const mockAppointment = createMockAppointment({
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'confirmed',
    payment_status: 'paid',
    profiles: {
      full_name: 'Dr. Jane Smith',
    },
  })

  it('displays appointment details correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText(/consultation with/i)).toBeInTheDocument()
    expect(screen.getByText(/dr. jane smith/i)).toBeInTheDocument()
  })

  it('shows correct status badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    expect(screen.getByText('confirmed')).toBeInTheDocument()
  })

  it('handles reschedule button', async () => {
    const user = userEvent.setup()
    render(<AppointmentCard appointment={mockAppointment} />)

    const rescheduleButton = screen.getByText(/reschedule/i)
    await user.click(rescheduleButton)

    expect(screen.getByText(/close reschedule/i)).toBeInTheDocument()
  })

  it('handles cancel button', async () => {
    const user = userEvent.setup()
    render(<AppointmentCard appointment={mockAppointment} />)

    const cancelButton = screen.getByText(/cancel/i)
    await user.click(cancelButton)

    expect(screen.getByText(/close cancel/i)).toBeInTheDocument()
  })

  it('formats dates and times correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />)
    // Check that date formatting is present
    const dateElements = screen.getAllByText(/\w{3} \d{1,2}, \d{4}/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('hides actions when showActions is false', () => {
    render(<AppointmentCard appointment={mockAppointment} showActions={false} />)
    expect(screen.queryByText(/reschedule/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument()
  })
})
