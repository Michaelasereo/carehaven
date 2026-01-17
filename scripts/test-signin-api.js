/**
 * Test server-side sign-in API route
 * Run with: node scripts/test-signin-api.js
 * 
 * Make sure the dev server is running on http://localhost:3000
 */

const http = require('http');
const { URL } = require('url');
require('dotenv').config({ path: '.env.local' });

// Configuration
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'asereope@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Michael1998#';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            cookies: res.headers['set-cookie'] || [],
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            cookies: res.headers['set-cookie'] || [],
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSignInAPI() {
  console.log('🧪 Testing Server-Side Sign-In API\n');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}/api/auth/signin`);
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${'*'.repeat(TEST_PASSWORD.length)}\n`);

  try {
    const url = new URL(`${API_URL}/api/auth/signin`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    console.log('📝 Step 1: Calling /api/auth/signin...');
    const response = await makeRequest(options, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));

    // Check cookies
    console.log('\n🍪 Step 2: Checking cookies...');
    if (response.cookies.length > 0) {
      console.log(`   ✅ ${response.cookies.length} cookie(s) received:`);
      response.cookies.forEach((cookie, index) => {
        const cookieParts = cookie.split(';')[0].split('=');
        const cookieName = cookieParts[0];
        const cookieValue = cookieParts[1] ? cookieParts[1].substring(0, 20) + '...' : '';
        console.log(`   ${index + 1}. ${cookieName}=${cookieValue}`);
      });
      
      // Check for Supabase auth cookies
      const supabaseCookies = response.cookies.filter(c => 
        c.includes('sb-') || c.toLowerCase().includes('supabase')
      );
      if (supabaseCookies.length > 0) {
        console.log(`   ✅ Found ${supabaseCookies.length} Supabase auth cookie(s)`);
      } else {
        console.log(`   ⚠️  No Supabase auth cookies found (sb-* pattern)`);
      }
    } else {
      console.log('   ❌ No cookies received!');
      console.log('   ⚠️  This is a problem - cookies are needed for session management');
    }

    // Check response
    console.log('\n📊 Step 3: Analyzing response...');
    if (response.statusCode === 200 && response.body.success) {
      console.log('   ✅ Sign-in API call successful');
      console.log(`   User ID: ${response.body.user?.id || 'N/A'}`);
      console.log(`   Email: ${response.body.user?.email || 'N/A'}`);
    } else {
      console.log(`   ❌ Sign-in failed (Status: ${response.statusCode})`);
      if (response.body.error) {
        console.log(`   Error: ${response.body.error}`);
      }
    }

    // Test callback route if sign-in was successful
    if (response.statusCode === 200 && response.body.success && response.cookies.length > 0) {
      console.log('\n🔗 Step 4: Testing callback route with cookies...');
      
      // Extract cookies for the callback request
      const cookieHeader = response.cookies.join('; ');
      
      const callbackUrl = new URL(`${API_URL}/auth/callback?next=/patient`);
      const callbackOptions = {
        hostname: callbackUrl.hostname,
        port: callbackUrl.port || (callbackUrl.protocol === 'https:' ? 443 : 80),
        path: callbackUrl.pathname + callbackUrl.search,
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'Accept': 'text/html,application/xhtml+xml',
        },
      };

      try {
        const callbackResponse = await makeRequest(callbackOptions);
        console.log(`   Callback Status: ${callbackResponse.statusCode}`);
        
        if (callbackResponse.statusCode === 302 || callbackResponse.statusCode === 307) {
          const location = callbackResponse.headers.location;
          console.log(`   ✅ Callback redirected to: ${location}`);
          
          if (location && (location.includes('/patient') || location.includes('/doctor') || location.includes('/admin'))) {
            console.log('   ✅ Redirected to dashboard (expected)');
          } else if (location && location.includes('/auth/signin')) {
            console.log('   ⚠️  Redirected back to sign-in (session not recognized)');
          } else if (location && location.includes('/complete-profile')) {
            console.log('   ℹ️  Redirected to complete-profile (profile incomplete)');
          } else {
            console.log(`   ℹ️  Redirected to: ${location}`);
          }
        } else {
          console.log(`   Response body (first 200 chars): ${JSON.stringify(callbackResponse.body).substring(0, 200)}`);
        }
      } catch (callbackError) {
        console.log(`   ⚠️  Error testing callback: ${callbackError.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   API Status: ${response.statusCode === 200 ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Cookies Received: ${response.cookies.length > 0 ? `✅ ${response.cookies.length}` : '❌ None'}`);
    console.log(`   Supabase Cookies: ${response.cookies.some(c => c.includes('sb-')) ? '✅ Found' : '❌ Missing'}`);
    
    if (response.statusCode === 200 && response.body.success && response.cookies.length > 0) {
      console.log('\n✅ All checks passed! Server-side sign-in is working correctly.');
    } else {
      console.log('\n⚠️  Some checks failed. Review the output above for details.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Could not connect to server. Make sure the dev server is running:');
      console.error('      npm run dev');
    }
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testSignInAPI()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
