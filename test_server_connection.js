// Test server connection script
// Run this with: node test_server_connection.js

const ipsToTest = [
  '192.168.100.204',  // Current WiFi IP (primary)
  '172.20.10.2',      // Mobile data IP (fallback)
  '192.168.100.179',  // Previous WiFi IP
  'localhost',         // Localhost
  '127.0.0.1',        // Localhost IP
];

async function testConnection(ip) {
  try {
    console.log(`🔍 Testing connection to ${ip}:8000`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://${ip}:8000/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ ${ip}:8000 - Server is running! (Status: ${response.status})`);
      return true;
    } else {
      console.log(`⚠️ ${ip}:8000 - Server responded but with error (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${ip}:8000 - Connection failed: ${error.message}`);
    return false;
  }
}

async function testAllConnections() {
  console.log('🚀 Testing server connections...\n');
  
  let workingIP = null;
  
  for (const ip of ipsToTest) {
    const isWorking = await testConnection(ip);
    if (isWorking && !workingIP) {
      workingIP = ip;
    }
    console.log(''); // Empty line for readability
  }
  
  if (workingIP) {
    console.log(`🎉 Found working server at: ${workingIP}:8000`);
    console.log('✅ Your app should be able to connect to this IP.');
  } else {
    console.log('❌ No working server found!');
    console.log('🔧 Please check:');
    console.log('   1. Is your Laravel server running? (php artisan serve --host=0.0.0.0 --port=8000)');
    console.log('   2. Are you on the same WiFi network?');
    console.log('   3. Is the IP address correct?');
  }
}

// Run the test
testAllConnections().catch(console.error);
