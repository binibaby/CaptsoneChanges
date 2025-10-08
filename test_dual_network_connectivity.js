#!/usr/bin/env node

/**
 * Test script to verify API connectivity on both WiFi and mobile data
 * This script tests all configured IP addresses to ensure the API works
 * on both network types.
 */

const https = require('https');
const http = require('http');

// Network configuration (matches frontend config)
const NETWORK_CONFIG = {
  PRIMARY_IPS: [
    '192.168.100.192',  // Current WiFi IP (primary)
    '172.20.10.2',      // Mobile data IP (fallback)
    '172.20.10.1',      // Mobile hotspot gateway
  ],
  
  FALLBACK_IPS: [
    '192.168.100.192',  // Current WiFi IP (primary)
    '172.20.10.2',      // Mobile data IP (fallback)
    '172.20.10.1',      // Common mobile hotspot gateway
    '192.168.100.184',  // Previous WiFi IP
    '192.168.100.179',  // Previous WiFi IP
    '192.168.1.100',    // Common home WiFi
    '192.168.0.100',    // Common home WiFi
    '192.168.43.1',     // Android hotspot
    '192.168.137.1',    // Windows mobile hotspot
    '10.0.0.100',       // Corporate networks
    '172.20.10.3',      // Additional mobile data IP
    '172.20.10.4',      // Additional mobile data IP
    '192.168.100.1',    // WiFi gateway (if server is on gateway)
    'localhost',         // Local development
    '127.0.0.1',        // Local development
  ],
  
  CONNECTION_TIMEOUT: 2000,
  PORT: 8000,
};

// Test function for a single IP
async function testIPConnection(ip, port = NETWORK_CONFIG.PORT) {
  return new Promise((resolve) => {
    const url = `http://${ip}:${port}/api/test`;
    const startTime = Date.now();
    
    console.log(`🌐 Testing: ${url}`);
    
    const request = http.get(url, {
      timeout: NETWORK_CONFIG.CONNECTION_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }, (response) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ${ip}:${port} - Status: ${response.statusCode} (${responseTime}ms)`);
      resolve({
        ip,
        port,
        status: response.statusCode,
        responseTime,
        success: response.statusCode >= 200 && response.statusCode < 500,
        networkType: getNetworkType(ip)
      });
    });
    
    request.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`❌ ${ip}:${port} - Error: ${error.message} (${responseTime}ms)`);
      resolve({
        ip,
        port,
        status: 0,
        responseTime,
        success: false,
        error: error.message,
        networkType: getNetworkType(ip)
      });
    });
    
    request.on('timeout', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏰ ${ip}:${port} - Timeout (${responseTime}ms)`);
      request.destroy();
      resolve({
        ip,
        port,
        status: 0,
        responseTime,
        success: false,
        error: 'Timeout',
        networkType: getNetworkType(ip)
      });
    });
  });
}

// Determine network type based on IP
function getNetworkType(ip) {
  if (ip === 'localhost' || ip === '127.0.0.1') {
    return 'Local Development';
  } else if (ip.startsWith('192.168.') || ip.startsWith('10.0.0.') || 
             ip.startsWith('172.16.') || ip.startsWith('172.17.') || 
             ip.startsWith('172.18.') || ip.startsWith('172.19.')) {
    return 'WiFi';
  } else if (ip.startsWith('172.20.10.') || ip.startsWith('172.20.11.') || 
             ip.startsWith('172.20.12.') || ip.startsWith('172.20.13.')) {
    return 'Mobile Data';
  } else if (ip.startsWith('192.168.43.') || ip.startsWith('192.168.137.')) {
    return 'Hotspot';
  }
  return 'Unknown';
}

// Main test function
async function testDualNetworkConnectivity() {
  console.log('🚀 Starting dual network connectivity test...\n');
  console.log('📱 This will test both WiFi and mobile data connectivity\n');
  
  const allIPs = [...new Set([...NETWORK_CONFIG.PRIMARY_IPS, ...NETWORK_CONFIG.FALLBACK_IPS])];
  const results = [];
  
  console.log(`🔍 Testing ${allIPs.length} IP addresses...\n`);
  
  // Test all IPs in parallel for faster results
  const testPromises = allIPs.map(ip => testIPConnection(ip));
  const testResults = await Promise.all(testPromises);
  
  // Process results
  const successfulConnections = testResults.filter(result => result.success);
  const failedConnections = testResults.filter(result => !result.success);
  
  // Group by network type
  const byNetworkType = {};
  testResults.forEach(result => {
    const type = result.networkType;
    if (!byNetworkType[type]) {
      byNetworkType[type] = { successful: [], failed: [] };
    }
    if (result.success) {
      byNetworkType[type].successful.push(result);
    } else {
      byNetworkType[type].failed.push(result);
    }
  });
  
  // Display results
  console.log('\n📊 CONNECTIVITY RESULTS\n');
  console.log('=' .repeat(50));
  
  Object.keys(byNetworkType).forEach(type => {
    const { successful, failed } = byNetworkType[type];
    console.log(`\n🌐 ${type}:`);
    console.log(`   ✅ Working: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('   📍 Working IPs:');
      successful.forEach(result => {
        console.log(`      - ${result.ip}:${result.port} (${result.responseTime}ms)`);
      });
    }
    
    if (failed.length > 0) {
      console.log('   📍 Failed IPs:');
      failed.forEach(result => {
        console.log(`      - ${result.ip}:${result.port} (${result.error || 'Unknown error'})`);
      });
    }
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total IPs tested: ${allIPs.length}`);
  console.log(`   Successful connections: ${successfulConnections.length}`);
  console.log(`   Failed connections: ${failedConnections.length}`);
  console.log(`   Success rate: ${((successfulConnections.length / allIPs.length) * 100).toFixed(1)}%`);
  
  if (successfulConnections.length > 0) {
    console.log('\n✅ API is accessible on at least one network!');
    console.log('📱 Your app should work on both WiFi and mobile data.');
    
    // Show the best connection
    const bestConnection = successfulConnections.reduce((best, current) => 
      current.responseTime < best.responseTime ? current : best
    );
    console.log(`\n🏆 Best connection: ${bestConnection.ip}:${bestConnection.port} (${bestConnection.responseTime}ms) - ${bestConnection.networkType}`);
  } else {
    console.log('\n❌ No working connections found!');
    console.log('🔧 Please check:');
    console.log('   1. Laravel server is running (php artisan serve)');
    console.log('   2. Server is accessible on the network');
    console.log('   3. Firewall settings allow connections');
    console.log('   4. Mobile hotspot is enabled (if testing mobile data)');
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (successfulConnections.length > 0) {
    console.log('   ✅ Your network configuration is working!');
    console.log('   📱 Test switching between WiFi and mobile data');
    console.log('   🔄 The app will automatically detect the best connection');
  } else {
    console.log('   🔧 Start the Laravel server: cd pet-sitting-app && php artisan serve');
    console.log('   📱 Enable mobile hotspot to test mobile data connectivity');
    console.log('   🌐 Check your network configuration');
  }
  
  console.log('\n✨ Test completed!\n');
}

// Run the test
if (require.main === module) {
  testDualNetworkConnectivity().catch(console.error);
}

module.exports = { testDualNetworkConnectivity, testIPConnection };
