/**
 * Diagnostic Script: Test Verification Email Sending
 * 
 * Tests if Supabase native email service is working for verification emails
 * 
 * Run: npx tsx scripts/test-verification-email-sending.ts your-email@domain.com
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const testEmail = process.argv[2]

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`)
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`)
  process.exit(1)
}

if (!testEmail) {
  console.error('❌ Please provide an email address:')
  console.error('   npx tsx scripts/test-verification-email-sending.ts your-email@domain.com')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testEmailSending() {
  console.log('\n🔍 Diagnostic: Testing Verification Email Sending')
  console.log('='.repeat(60))
  console.log(`📧 Test Email: ${testEmail}`)
  console.log(`🌐 Supabase URL: ${supabaseUrl}\n`)

  try {
    // Step 1: Check if user exists
    console.log('📝 Step 1: Checking if user exists...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    const existingUser = users?.find(u => u.email === testEmail)
    
    if (!existingUser) {
      console.log('   ⚠️  User not found. Creating test user...')
      
      // Create a test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Test123!@#',
        email_confirm: false,
      })

      if (createError || !newUser.user) {
        console.error('❌ Failed to create test user:', createError?.message)
        return
      }

      console.log(`   ✅ Test user created: ${newUser.user.id}`)
      console.log(`   📧 Email confirmed: ${newUser.user.email_confirmed_at ? 'Yes' : 'No'}\n`)

      // Step 2: Try sending verification email
      console.log('📧 Step 2: Sending verification email via Supabase native service...')
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
      })

      if (resendError) {
        console.error('❌ Error sending email:', resendError.message)
        console.error('   Code:', resendError.status)
        
        // Common error messages
        if (resendError.message?.includes('rate limit')) {
          console.log('\n💡 Solution: Rate limit reached. Wait a few minutes and try again.')
        } else if (resendError.message?.includes('disabled') || resendError.message?.includes('not enabled')) {
          console.log('\n💡 Solution: Email confirmations may be disabled in Supabase.')
          console.log('   Go to: Supabase Dashboard → Authentication → Settings → Email Auth')
          console.log('   Enable: "Enable email confirmations"')
        } else if (resendError.message?.includes('invalid')) {
          console.log('\n💡 Solution: Email address format may be invalid.')
        } else {
          console.log('\n💡 Check Supabase Dashboard → Authentication → Settings')
          console.log('   Ensure email confirmations are enabled')
        }
      } else {
        console.log('✅ Verification email sent successfully!')
        console.log('\n📬 Next steps:')
        console.log('   1. Check your inbox:', testEmail)
        console.log('   2. Check spam/junk folder')
        console.log('   3. Check Supabase Dashboard → Authentication → Users')
        console.log('   4. Look for the user and check email status')
      }

      // Cleanup
      console.log('\n🧹 Cleaning up test user...')
      await supabase.auth.admin.deleteUser(newUser.user.id)
      
    } else {
      console.log(`   ✅ User found: ${existingUser.id}`)
      console.log(`   📧 Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}\n`)

      if (existingUser.email_confirmed_at) {
        console.log('⚠️  User email is already confirmed.')
        console.log('   Supabase may not send verification emails to confirmed users.')
        console.log('\n💡 To test:')
        console.log('   1. Use a different email address, or')
        console.log('   2. Unconfirm the email in Supabase Dashboard')
        return
      }

      // Step 2: Try sending verification email
      console.log('📧 Step 2: Sending verification email via Supabase native service...')
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
      })

      if (resendError) {
        console.error('❌ Error sending email:', resendError.message)
        console.error('   Code:', resendError.status)
        
        // Common error messages
        if (resendError.message?.includes('rate limit')) {
          console.log('\n💡 Solution: Rate limit reached. Wait a few minutes and try again.')
        } else if (resendError.message?.includes('disabled') || resendError.message?.includes('not enabled')) {
          console.log('\n💡 Solution: Email confirmations may be disabled in Supabase.')
          console.log('   Go to: Supabase Dashboard → Authentication → Settings → Email Auth')
          console.log('   Enable: "Enable email confirmations"')
        } else if (resendError.message?.includes('invalid')) {
          console.log('\n💡 Solution: Email address format may be invalid.')
        } else {
          console.log('\n💡 Check Supabase Dashboard → Authentication → Settings')
          console.log('   Ensure email confirmations are enabled')
        }
      } else {
        console.log('✅ Verification email sent successfully!')
        console.log('\n📬 Next steps:')
        console.log('   1. Check your inbox:', testEmail)
        console.log('   2. Check spam/junk folder')
        console.log('   3. Check Supabase Dashboard → Authentication → Users')
        console.log('   4. Look for the user and check email status')
      }
    }

    // Step 3: Check Supabase email settings
    console.log('\n⚙️  Step 3: Checking Supabase configuration...')
    console.log('   📋 Manual check required:')
    console.log('   1. Go to: Supabase Dashboard → Authentication → Settings → Email Auth')
    console.log('   2. Verify "Enable email confirmations" is ON')
    console.log('   3. Check "Confirm email" setting')
    console.log('   4. Review email rate limits (free tier has limits)')
    console.log('   5. Check Supabase Dashboard → Logs for email sending errors')

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

testEmailSending()
  .then(() => {
    console.log('\n' + '='.repeat(60))
    console.log('✅ Diagnostic complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error)
    process.exit(1)
  })
