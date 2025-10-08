/**
 * Test Authentication Flow
 * 
 * This script tests the authentication flow for the enhanced verification
 */

const https = require('https');
const http = require('http');

// Test configuration
const testIPs = [
  '192.168.100.192',  // WiFi IP (primary)
  '172.20.10.2',      // Mobile data IP (fallback)
  'localhost',         // Local development
];

async function testAuthEndpoint(ip) {
  return new Promise((resolve) => {
    const port = ip === 'localhost' ? '8000' : '8000';
    const url = `http://${ip}:${port}/api/verification/submit-enhanced`;
    
    console.log(`🔍 Testing auth endpoint: ${url}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // Test token
      },
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Response from ${ip}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers:`, res.headers);
        console.log(`   Body:`, data.substring(0, 200) + (data.length > 200 ? '...' : ''));
        
        let parsedData = {};
        try {
          parsedData = JSON.parse(data || '{}');
        } catch (e) {
          // Not JSON, that's okay for redirects
        }
        
        resolve({
          ip,
          status: res.statusCode,
          success: res.statusCode === 401 || res.statusCode === 302, // 401 or 302 is expected for unauthenticated request
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error testing ${ip}:`, error.message);
      resolve({
        ip,
        status: 'error',
        success: false,
        error: error.message
      });
    });
    
    req.write(JSON.stringify({
      front_id_image: 'test',
      back_id_image: 'test',
      selfie_image: 'test',
      selfie_latitude: 0,
      selfie_longitude: 0,
      selfie_address: 'test',
      location_accuracy: 0,
      document_type: 'ph_national_id'
    }));
    
    req.end();
  });
}

async function testAllAuthEndpoints() {
  console.log('🔐 AUTHENTICATION FLOW TEST');
  console.log('============================\n');
  
  const results = [];
  
  for (const ip of testIPs) {
    const result = await testAuthEndpoint(ip);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 SUMMARY:');
  console.log('===========');
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.ip}: Authentication working (401 expected)`);
    } else if (result.status === 'error') {
      console.log(`❌ ${result.ip}: Connection failed - ${result.error}`);
    } else {
      console.log(`⚠️  ${result.ip}: Unexpected status ${result.status}`);
    }
  });
  
  const workingEndpoints = results.filter(r => r.success);
  if (workingEndpoints.length > 0) {
    console.log(`\n🎉 Found ${workingEndpoints.length} working endpoint(s)!`);
    console.log('💡 The authentication system is working correctly.');
    console.log('🔧 Make sure your frontend is sending a valid Bearer token.');
  } else {
    console.log('\n❌ No working endpoints found.');
    console.log('🔧 Check your server configuration and network connectivity.');
  }
}

// Run the test
testAllAuthEndpoints().catch(console.error);
