// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗')
console.log('Anon Key:', supabaseAnonKey ? 'Set ✓' : 'Missing ✗')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Connection error:', error.message)
      process.exit(1)
    } else {
      console.log('✅ Supabase connection successful!')
      process.exit(0)
    }
  })
  .catch((err) => {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  })
