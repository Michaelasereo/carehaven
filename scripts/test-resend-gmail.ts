import { sendEmail } from '../lib/email/resend-client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testResendGmail() {
  console.log('🧪 Testing Resend with Gmail Sender');
  console.log('===================================\n');

  const testEmail = process.argv[2] || 'asereope@gmail.com';

  console.log(`📧 Sending to: ${testEmail}`);
  console.log(`📤 From: Care Haven <asereopeyemimichael@gmail.com>\n`);

  try {
    await sendEmail({
      to: testEmail,
      subject: 'Welcome to Care Haven! 🏡',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Care Haven</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏡 Care Haven</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your trusted care companion</p>
            </div>
            <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Hello! 👋</h2>
              <p>This is a test email sent through <strong>Resend</strong> using a Gmail sender address.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0d9488;">
                <h3 style="color: #0d9488; margin-top: 0;">✅ What this confirms:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Resend API is working correctly</li>
                  <li>Gmail sender is properly configured</li>
                  <li>Email delivery is functional</li>
                  <li>HTML emails render properly</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This is an automated test email from Care Haven.<br>
                Sent via Resend using Gmail sender.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>Care Haven • Healthcare Management Platform</p>
            </div>
          </body>
        </html>
      `,
      text: `Welcome to Care Haven!\n\nThis is a test email sent through Resend using a Gmail sender address.\n\nWhat this confirms:\n✅ Resend API is working correctly\n✅ Gmail sender is properly configured\n✅ Email delivery is functional\n\nThis is an automated test email.`,
    });

    console.log('🎉 Test completed successfully!');
    console.log('\n📬 Check your:');
    console.log('   • Inbox');
    console.log('   • Spam folder (if not in inbox)');
    console.log('   • Promotions tab (Gmail specific)');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    
    if (error.message?.includes('not verified') || error.message?.includes('domain')) {
      console.log('\n⚠️  Gmail sender needs to be verified in Resend:');
      console.log('   1. Go to https://resend.com/emails');
      console.log('   2. Click "Add Email Address" or "Verify Domain"');
      console.log('   3. For Gmail: Add "asereopeyemimichael@gmail.com" as a sender');
      console.log('   4. Check your Gmail inbox for verification email');
      console.log('   5. Click the verification link');
      console.log('\n   Alternatively, use Resend\'s default sender for testing:');
      console.log('   Change from address to: "onboarding@resend.dev"');
    } else {
      console.log('   1. Check RESEND_API_KEY in .env.local');
      console.log('   2. Verify your Resend account has credits');
      console.log('   3. Check Resend dashboard for errors');
    }
    process.exit(1);
  }
}

testResendGmail();
