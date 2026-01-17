/**
 * Resend Email Verification Check
 * 
 * Note: Resend does NOT support verifying individual email addresses (like Gmail)
 * via API. Only domains can be verified via DNS records.
 * 
 * This script checks verification status and provides alternatives.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const senderEmail = process.argv[2] || 'asereopeyemimichael@gmail.com';

async function checkResendVerification() {
  console.log('\n📧 Resend Email Verification Check');
  console.log('===================================\n');

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in .env.local');
    process.exit(1);
  }

  console.log(`✅ Resend API Key found: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`📧 Sender Email: ${senderEmail}\n`);

  const resend = new Resend(RESEND_API_KEY);

  try {
    // Check if it's a Gmail/third-party email
    const isGmail = senderEmail.includes('@gmail.com') || 
                    senderEmail.includes('@yahoo.com') || 
                    senderEmail.includes('@outlook.com') ||
                    senderEmail.includes('@hotmail.com');

    if (isGmail) {
      console.log('⚠️  IMPORTANT: Gmail/Third-party Email Limitation\n');
      console.log('Resend does NOT support verifying individual email addresses');
      console.log('(like Gmail) via API. You can only verify domains you own.\n');
      console.log('📋 Options:\n');
      console.log('   1. Manual Verification (Recommended for Gmail):');
      console.log('      → Go to: https://resend.com/emails');
      console.log('      → Click "Add Email Address"');
      console.log('      → Enter:', senderEmail);
      console.log('      → Check your inbox for verification email');
      console.log('      → Click the verification link\n');
      console.log('   2. Use a Custom Domain (Best for Production):');
      console.log('      → Verify your own domain (e.g., carehaven.app)');
      console.log('      → Then use any email @yourdomain.com');
      console.log('      → No individual email verification needed\n');
      console.log('   3. Use Resend Default Domain (For Testing):');
      console.log('      → Use: onboarding@resend.dev');
      console.log('      → No verification needed, but limited functionality\n');
      
      // Try to check domains API
      try {
        console.log('\n🔍 Checking your Resend domains...\n');
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
        });

        if (response.ok) {
          const domains = await response.json();
          if (domains.data && domains.data.length > 0) {
            console.log('✅ Verified domains found:');
            domains.data.forEach((domain: any) => {
              console.log(`   - ${domain.name} (${domain.status})`);
            });
            console.log('\n💡 You can use any email @yourdomain.com without verification!');
          } else {
            console.log('ℹ️  No verified domains found');
            console.log('   Add a domain at: https://resend.com/domains');
          }
        }
      } catch (error) {
        console.log('ℹ️  Could not fetch domains (this is normal)');
      }

      console.log('\n📝 Next Steps:');
      console.log('   1. Manually verify your Gmail address in Resend dashboard');
      console.log('   2. OR set up a custom domain for production use');
      console.log('   3. After verification, your emails will work automatically\n');

    } else {
      // Custom domain - check if it's verified
      const domain = senderEmail.split('@')[1];
      console.log(`🔍 Checking domain: ${domain}\n`);
      
      try {
        const response = await fetch(`https://api.resend.com/domains/${domain}`, {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
        });

        if (response.ok) {
          const domainData = await response.json();
          if (domainData.status === 'verified') {
            console.log(`✅ Domain ${domain} is verified!`);
            console.log(`✅ You can send from ${senderEmail} without issues\n`);
          } else {
            console.log(`⚠️  Domain ${domain} is not verified`);
            console.log(`   Status: ${domainData.status}`);
            console.log(`   Verify at: https://resend.com/domains/${domain}\n`);
          }
        } else {
          console.log(`⚠️  Domain ${domain} not found in your Resend account`);
          console.log(`   Add it at: https://resend.com/domains\n`);
        }
      } catch (error: any) {
        console.log(`ℹ️  Could not check domain status: ${error.message}`);
      }
    }

    // Test sending capability (this will show if verification is needed)
    console.log('🧪 Testing email sending capability...\n');
    console.log('   (This will attempt to send to verify status)\n');
    
    // Use a real test email if provided, otherwise use a placeholder
    const testEmail = process.argv[3] || 'test@example.com';
    
    try {
      const testResult = await resend.emails.send({
        from: senderEmail,
        to: testEmail,
        subject: 'Verification Test',
        html: '<p>This is a test to check if your sender email is verified.</p>',
      });
      console.log('✅ Email sending test passed!');
      console.log(`   Message ID: ${testResult.id}`);
      console.log('   Your sender email appears to be verified!\n');
    } catch (error: any) {
      if (error.message?.includes('not verified') || error.message?.includes('domain') || error.message?.includes('403')) {
        console.log('❌ Email sending failed - verification required');
        console.log(`   Error: ${error.message}\n`);
        console.log('💡 Solution: Verify the email address manually in Resend dashboard');
        console.log('   → https://resend.com/emails\n');
      } else if (error.message?.includes('Invalid') || error.message?.includes('400')) {
        console.log('⚠️  Could not complete test (invalid recipient email)');
        console.log('   To properly test, provide a real email:');
        console.log(`   npm run verify:resend ${senderEmail} your-email@example.com\n`);
      } else {
        console.log(`⚠️  Error: ${error.message}\n`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkResendVerification()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
