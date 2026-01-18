import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { renderWithProviders as render }

// Mock user data factory
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock profile data factory
export function createMockProfile(overrides?: Partial<any>) {
  return {
    id: 'test-user-id',
    role: 'patient',
    email: 'test@example.com',
    full_name: 'Test User',
    profile_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock appointment data factory
export function createMockAppointment(overrides?: Partial<any>) {
  return {
    id: 'test-appointment-id',
    patient_id: 'test-patient-id',
    doctor_id: 'test-doctor-id',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    duration_minutes: 30,
    status: 'scheduled',
    payment_status: 'paid',
    amount: '20000.00',
    currency: 'NGN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock prescription data factory
export function createMockPrescription(overrides?: Partial<any>) {
  return {
    id: 'test-prescription-id',
    appointment_id: 'test-appointment-id',
    patient_id: 'test-patient-id',
    doctor_id: 'test-doctor-id',
    medications: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        instructions: 'Take twice daily',
      },
    ],
    instructions: 'Take with food',
    duration_days: 7,
    refills_remaining: 0,
    status: 'active',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock investigation data factory
export function createMockInvestigation(overrides?: Partial<any>) {
  return {
    id: 'test-investigation-id',
    appointment_id: 'test-appointment-id',
    patient_id: 'test-patient-id',
    doctor_id: 'test-doctor-id',
    test_name: 'Blood Test',
    test_type: 'Laboratory',
    status: 'requested',
    requested_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock consultation notes data factory
export function createMockConsultationNotes(overrides?: Partial<any>) {
  return {
    id: 'test-notes-id',
    appointment_id: 'test-appointment-id',
    doctor_id: 'test-doctor-id',
    subjective: 'Patient complains of headache',
    objective: 'Blood pressure normal',
    assessment: 'Migraine',
    plan: 'Prescribe pain medication',
    diagnosis: 'Migraine',
    prescription: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// Wait for loading to finish
export async function waitForLoadingToFinish() {
  const { queryByTestId } = await import('@testing-library/react')
  return new Promise((resolve) => {
    const checkLoading = () => {
      const loadingElement = queryByTestId(document.body, 'loading')
      if (!loadingElement) {
        resolve(true)
      } else {
        setTimeout(checkLoading, 100)
      }
    }
    checkLoading()
  })
}

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      abortSignal: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      csv: jest.fn(),
      geojson: jest.fn(),
      explain: jest.fn(),
      rollback: jest.fn(),
      returns: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        createSignedUrl: jest.fn(),
        createSignedUrls: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    realtime: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn().mockReturnThis(),
      })),
    },
  }
}
