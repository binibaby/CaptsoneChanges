const https = require('https');

const url = 'https://pet-sitting-backend.onrender.com/api/health';

console.log('🔍 Checking backend health...\n');

const startTime = Date.now();

const req = https.get(url, (res) => {
  const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📊 HEALTH CHECK RESULTS');
    console.log('═══════════════════════════════');
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response Time: ${responseTime}s`);
    console.log(`Response: ${data || 'No content'}`);
    console.log('');
    
    if (res.statusCode === 200 || res.statusCode === 302) {
      console.log('✅ Backend is HEALTHY and responding!');
    } else {
      console.log(`⚠️  Backend returned status ${res.statusCode}`);
    }
  });
});

req.setTimeout(10000, () => {
  console.log('❌ Request timeout (10s) - backend may be slow or sleeping');
  req.destroy();
  process.exit(1);
});

req.on('error', (error) => {
  console.log('❌ Error:', error.message);
  process.exit(1);
});

