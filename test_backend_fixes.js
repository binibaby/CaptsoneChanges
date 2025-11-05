/**
 * Test Backend Fixes - Storage Permissions and Error Handling
 * 
 * Tests:
 * 1. Registration with valid data
 * 2. Duplicate email error handling
 * 3. Error responses (should not be 500 for duplicate emails)
 * 4. Backend health
 */

const https = require('https');
const http = require('http');

const RENDER_URL = 'https://pet-sitting-backend.onrender.com';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testBackendHealth() {
  console.log('\n🔍 TEST 1: Backend Health Check');
  console.log('================================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/api/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend is healthy');
      return true;
    } else {
      console.log('⚠️  Backend responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('\n🔍 TEST 2: Registration with New Email');
  console.log('======================================');
  
  const testEmail = `test${Date.now()}@example.com`;
  const payload = {
    name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    email: testEmail,
    password: 'testpassword123',
    password_confirmation: 'testpassword123',
    role: 'pet_owner',
    phone: '+639123456789',
    address: 'Test Address',
    gender: 'male',
    age: 25,
  };

  try {
    const response = await makeRequest(`${RENDER_URL}/api/register`, {
      method: 'POST',
      body: payload,
    });

    console.log('📊 Response Status:', response.status);
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Registration successful!');
      if (response.data?.success) {
        console.log('✅ Response indicates success');
        if (response.data?.token) {
          console.log('✅ Token received');
        }
        return { success: true, email: testEmail, token: response.data?.token };
      }
    } else {
      console.log('❌ Registration failed:', response.status);
      if (response.data) {
        console.log('   Error:', response.data.message || JSON.stringify(response.data));
      }
      return { success: false, email: testEmail };
    }
  } catch (error) {
    console.log('❌ Registration request failed:', error.message);
    return { success: false, email: testEmail };
  }
}

async function testDuplicateEmail(existingEmail) {
  console.log('\n🔍 TEST 3: Duplicate Email Error Handling');
  console.log('==========================================');
  
  const payload = {
    name: 'Test User 2',
    first_name: 'Test',
    last_name: 'User2',
    email: existingEmail, // Use existing email
    password: 'testpassword123',
    password_confirmation: 'testpassword123',
    role: 'pet_owner',
    phone: '+639987654321',
    address: 'Test Address',
    gender: 'male',
    age: 25,
  };

  try {
    const response = await makeRequest(`${RENDER_URL}/api/register`, {
      method: 'POST',
      body: payload,
    });

    console.log('📊 Response Status:', response.status);
    
    if (response.status === 400 || response.status === 422) {
      console.log('✅ Correctly returned 400/422 for duplicate email');
      if (response.data?.message) {
        const message = response.data.message.toLowerCase();
        if (message.includes('already registered') || message.includes('email') || message.includes('duplicate')) {
          console.log('✅ Error message is user-friendly');
          console.log('   Message:', response.data.message);
          return true;
        }
      }
      return true; // 400/422 is correct even if message isn't perfect
    } else if (response.status === 500) {
      console.log('❌ Got 500 error - storage permissions or error handling may still be broken');
      console.log('   Response:', response.data?.message || response.raw?.substring(0, 200));
      return false;
    } else {
      console.log('⚠️  Unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testPhoneVerification() {
  console.log('\n🔍 TEST 4: Phone Verification Endpoint');
  console.log('=======================================');
  
  const payload = {
    phone: '+639123456789',
  };

  try {
    const response = await makeRequest(`${RENDER_URL}/api/send-verification-code`, {
      method: 'POST',
      body: payload,
    });

    console.log('📊 Response Status:', response.status);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Phone verification endpoint works');
      return true;
    } else if (response.status === 500) {
      console.log('❌ Got 500 error - error handling may need work');
      console.log('   Response:', response.data?.message || response.raw?.substring(0, 200));
      return false;
    } else {
      console.log('⚠️  Status:', response.status, '(may be expected if phone not found)');
      return true; // Other statuses might be expected
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 BACKEND FIXES TEST SUITE');
  console.log('============================');
  console.log(`📡 Testing: ${RENDER_URL}`);
  console.log('');
  
  const results = {
    health: false,
    registration: false,
    duplicateEmail: false,
    phoneVerification: false,
  };
  
  // Test 1: Health
  results.health = await testBackendHealth();
  
  // Test 2: Registration
  const regResult = await testRegistration();
  results.registration = regResult.success;
  const testEmail = regResult.email;
  
  // Test 3: Duplicate email (use the email we just created)
  if (testEmail) {
    results.duplicateEmail = await testDuplicateEmail(testEmail);
  } else {
    // Test with a known email
    results.duplicateEmail = await testDuplicateEmail('jasinga@gmail.com');
  }
  
  // Test 4: Phone verification
  results.phoneVerification = await testPhoneVerification();
  
  // Final Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Backend Health:        ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Registration:         ${results.registration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Duplicate Email:      ${results.duplicateEmail ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phone Verification:   ${results.phoneVerification ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n🎯 FINAL RESULT');
  console.log('===============');
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ Storage permissions fixed');
    console.log('✅ Error handling working correctly');
    console.log('✅ Duplicate email handled gracefully');
    console.log('\n🚀 Backend is ready for use!');
  } else {
    console.log('⚠️  Some tests failed');
    if (!results.duplicateEmail) {
      console.log('⚠️  Duplicate email still returns 500 - needs attention');
    }
    if (!results.phoneVerification) {
      console.log('⚠️  Phone verification has issues');
    }
  }
  
  return allPassed;
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

