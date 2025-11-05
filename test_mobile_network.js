#!/usr/bin/env node

// Test script to verify WiFi network connectivity
const https = require('https');
const http = require('http');

const testIPs = [
  '192.168.100.204',  // Current WiFi IP (primary)
  '192.168.100.192',  // Previous WiFi IP (fallback)
  '172.20.10.2',      // Mobile data IP (fallback)
  '172.20.10.1',      // Mobile hotspot gateway
];

function testConnection(ip) {
  return new Promise((resolve) => {
    console.log(`🌐 Testing connection to ${ip}:8000...`);
    
    const options = {
      hostname: ip,
      port: 8000,
      path: '/',
      method: 'GET',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(options, (res) => {
      const isWorking = res.statusCode < 500;
      console.log(`${isWorking ? '✅' : '❌'} ${ip}:8000 - Status: ${res.statusCode}`);
      
      if (isWorking) {
        console.log(`🎉 Working IP found: ${ip}:8000`);
        resolve(ip);
      } else {
        resolve(null);
      }
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${ip}:8000 - Error: ${error.message}`);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.log(`❌ ${ip}:8000 - Timeout`);
      req.destroy();
      resolve(null);
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

async function testAllConnections() {
  console.log('🔍 Testing WiFi network connectivity...\n');
  
  for (const ip of testIPs) {
    const workingIP = await testConnection(ip);
    if (workingIP) {
      console.log(`\n✅ SUCCESS: Server is accessible at ${workingIP}:8000`);
      console.log('📶 WiFi configuration is working correctly!');
      return;
    }
  }
  
  console.log('\n❌ FAILED: No working IP addresses found');
  console.log('⚠️  Please ensure:');
  console.log('   1. Your server is running on port 8000');
  console.log('   2. Your WiFi IP is correct');
  console.log('   3. The server is accessible from your device');
}

testAllConnections().catch(console.error);
