/**
 * Test Authentication with Real Token
 * 
 * This script tests the verification endpoint with the actual token from the logs
 */

const http = require('http');

// Test configuration
const testIP = '192.168.100.192';
const testPort = 8000;
const testToken = '438|kieXA6MyRLSXbF40Mf5xJqixIZ8I42pPwZJ6WWMg2d19151f'; // Token from the logs

async function testWithToken() {
  return new Promise((resolve) => {
    const url = `http://${testIP}:${testPort}/api/verification/submit-simple`;
    
    console.log(`🔍 Testing with real token: ${url}`);
    console.log(`🔑 Using token: ${testToken.substring(0, 20)}...`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'Accept': 'application/json',
      },
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Response from ${testIP}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers:`, res.headers);
        
        try {
          const parsedData = JSON.parse(data);
          console.log(`   Body:`, parsedData);
        } catch (e) {
          console.log(`   Body (raw):`, data.substring(0, 200) + (data.length > 200 ? '...' : ''));
        }
        
        resolve({
          status: res.statusCode,
          success: res.statusCode === 200,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error testing ${testIP}:`, error.message);
      resolve({
        status: 'error',
        success: false,
        error: error.message
      });
    });
    
    // Send test payload
    const testPayload = {
      user_id: 101,
      document_type: 'ph_national_id',
      document_number: '123456789',
      front_image: 'test_base64_data',
      back_image: 'test_base64_data',
      selfie_image: 'test_base64_data',
      has_front_image: true,
      has_back_image: true,
      has_selfie_image: true,
    };
    
    req.write(JSON.stringify(testPayload));
    req.end();
  });
}

async function runTest() {
  console.log('🔐 AUTHENTICATION TEST WITH REAL TOKEN');
  console.log('======================================\n');
  
  const result = await testWithToken();
  
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  
  if (result.success) {
    console.log('✅ Authentication successful!');
    console.log('🎉 The token is valid and working.');
  } else if (result.status === 401) {
    console.log('❌ Still getting 401 - Token might be invalid or expired');
    console.log('🔧 Check if the token format is correct');
  } else if (result.status === 'error') {
    console.log('❌ Connection error:', result.error);
  } else {
    console.log(`⚠️ Unexpected status: ${result.status}`);
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. If 401: Check token validity and format');
  console.log('2. If 200: The authentication is working correctly');
  console.log('3. Check backend logs for detailed debugging info');
}

// Run the test
runTest().catch(console.error);
