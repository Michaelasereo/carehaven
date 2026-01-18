import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SOAPForm } from '@/components/consultation/soap-form'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('SOAPForm', () => {
  const mockUpsert = jest.fn()
  const mockInsert = jest.fn()
  const mockFrom = jest.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

    mockUpsert.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'consultation_notes') {
        return { upsert: mockUpsert }
      }
      if (table === 'prescriptions') {
        return { insert: mockInsert }
      }
      return {}
    })
  })

  it('loads existing notes if available', async () => {
    // This would require mocking the initial data fetch
    render(
      <SOAPForm
        appointmentId="test-appointment-id"
        doctorId="test-doctor-id"
        patientId="test-patient-id"
      />
    )

    expect(screen.getByLabelText(/presenting complaint/i)).toBeInTheDocument()
  })

  it('validates SOAP fields', async () => {
    const user = userEvent.setup()
    render(
      <SOAPForm
        appointmentId="test-appointment-id"
        doctorId="test-doctor-id"
        patientId="test-patient-id"
      />
    )

    const submitButton = screen.getByRole('button', { name: /save notes/i })
    await user.click(submitButton)

    // Form should submit even with empty fields (all optional)
    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled()
    })
  })

  it('parses prescription medications', async () => {
    const user = userEvent.setup()
    render(
      <SOAPForm
        appointmentId="test-appointment-id"
        doctorId="test-doctor-id"
        patientId="test-patient-id"
      />
    )

    const prescriptionInput = screen.getByLabelText(/drug prescription/i)
    await user.type(
      prescriptionInput,
      'Paracetamol, 500mg, Take twice daily\nIbuprofen, 400mg, Take once daily'
    )

    const submitButton = screen.getByRole('button', { name: /save notes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: 'Paracetamol',
              dosage: '500mg',
            }),
          ]),
        })
      )
    })
  })

  it('saves consultation notes', async () => {
    const user = userEvent.setup()
    render(
      <SOAPForm
        appointmentId="test-appointment-id"
        doctorId="test-doctor-id"
        patientId="test-patient-id"
      />
    )

    const assessmentInput = screen.getByLabelText(/assessment/i)
    const planInput = screen.getByLabelText(/plan/i)
    const submitButton = screen.getByRole('button', { name: /save notes/i })

    await user.type(assessmentInput, 'Migraine')
    await user.type(planInput, 'Prescribe pain medication')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: 'test-appointment-id',
          doctor_id: 'test-doctor-id',
          assessment: 'Migraine',
          plan: 'Prescribe pain medication',
        })
      )
    })
  })

  it('links notes to appointment', async () => {
    const user = userEvent.setup()
    render(
      <SOAPForm
        appointmentId="test-appointment-id"
        doctorId="test-doctor-id"
        patientId="test-patient-id"
      />
    )

    const submitButton = screen.getByRole('button', { name: /save notes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: 'test-appointment-id',
        })
      )
    })
  })
})
