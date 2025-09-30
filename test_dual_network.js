#!/usr/bin/env node

// Test script to verify dual network connectivity
const http = require('http');

const IPs = [
  '192.168.100.192',  // Current WiFi IP
  '172.20.10.2',      // Mobile data IP
  'localhost',         // Local development
  '127.0.0.1',        // Local development
];

async function testConnection(ip) {
  return new Promise((resolve) => {
    const options = {
      hostname: ip,
      port: 8000,
      path: '/api/health',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${ip}:8000 - Status: ${res.statusCode}`);
      resolve({ ip, status: res.statusCode, working: true });
    });

    req.on('error', (err) => {
      console.log(`❌ ${ip}:8000 - Error: ${err.message}`);
      resolve({ ip, status: 'error', working: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ ${ip}:8000 - Timeout`);
      req.destroy();
      resolve({ ip, status: 'timeout', working: false });
    });

    req.end();
  });
}

async function testAllConnections() {
  console.log('🔍 Testing dual network connectivity...\n');
  
  const results = [];
  
  for (const ip of IPs) {
    const result = await testConnection(ip);
    results.push(result);
  }
  
  console.log('\n📊 Results Summary:');
  console.log('==================');
  
  const workingIPs = results.filter(r => r.working);
  const failedIPs = results.filter(r => !r.working);
  
  if (workingIPs.length > 0) {
    console.log('✅ Working IPs:');
    workingIPs.forEach(r => console.log(`   - ${r.ip}:8000 (Status: ${r.status})`));
  }
  
  if (failedIPs.length > 0) {
    console.log('❌ Failed IPs:');
    failedIPs.forEach(r => console.log(`   - ${r.ip}:8000 (${r.status})`));
  }
  
  console.log('\n🎯 Recommendation:');
  if (workingIPs.length >= 2) {
    console.log('✅ Dual network support is working! Your app can switch between WiFi and mobile data.');
  } else if (workingIPs.length === 1) {
    console.log('⚠️  Only one network is working. Check your server configuration.');
  } else {
    console.log('❌ No networks are working. Please check your server is running.');
  }
}

testAllConnections().catch(console.error);
