/**
 * Shared helpers for profile update error logging and user-facing messages.
 * Ensures we always log Supabase code/message/details/hint and never show "Object" to users.
 *
 * Common 400 causes for profiles PATCH:
 * - gender: CHECK (male|female|other); empty string '' violates → use null.
 * - age: INTEGER; NaN or invalid type → use null or omit.
 * - Undefined in payload: avoid; use null or omit keys.
 * - "Could not find the 'age' column... schema cache": PostgREST schema cache stale.
 *   Fix: Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL editor (or Dashboard → API → Reload schema).
 */

const VALID_GENDERS = ['male', 'female', 'other'] as const

type ErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
  error?: { message?: string }
  reason?: string
}

function isUsefulMessage(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0 && s !== '[object Object]' && s !== 'Object'
}

export function logProfileUpdateError(context: string, error: unknown): void {
  const e = error as ErrorLike | null
  const payload = {
    code: e?.code,
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
  }
  console.error(`[Profile update] ${context}:`, payload)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && error != null) {
    try {
      console.error('[Profile update] raw error (dev):', JSON.stringify(error, null, 2))
    } catch {
      console.error('[Profile update] raw error (dev):', String(error))
    }
  }
}

/**
 * Returns a user-facing string for toasts. Never returns "[object Object]" or "Object".
 */
export function getProfileUpdateErrorMessage(error: unknown): string {
  const e = error as ErrorLike | null
  const candidates = [
    e?.message,
    e?.details,
    e?.error?.message,
    e?.reason,
  ]
  for (const c of candidates) {
    if (isUsefulMessage(c)) return c
  }
  return 'Update failed'
}

/** Sanitize gender: only 'male' | 'female' | 'other' or null. Empty string / invalid → null. */
export function sanitizeGender(value: string | null | undefined): 'male' | 'female' | 'other' | null {
  if (value && VALID_GENDERS.includes(value as (typeof VALID_GENDERS)[number])) {
    return value as 'male' | 'female' | 'other'
  }
  return null
}

/** Sanitize age: integer in [0, 150] or null. NaN / out-of-range / missing → null. */
export function sanitizeAge(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (Number.isNaN(n) || n < 0 || n > 150) return null
  return n
}

/**
 * Sanitize years_experience: only '1-5' or '>5'. Otherwise returns null (omit from payload).
 */
export function sanitizeYearsExperience(
  value: string | null | undefined
): '1-5' | '>5' | null {
  if (value === '1-5' || value === '>5') return value
  return null
}
