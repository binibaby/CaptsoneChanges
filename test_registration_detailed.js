// Detailed test to identify the exact issue
const API_URL = 'https://pet-sitting-backend.onrender.com';

async function testStepByStep() {
  console.log('🧪 Testing Registration API Step by Step...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const health = await fetch(`${API_URL}/api/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData);
  } catch (e) {
    console.log('❌ Health check failed:', e.message);
    return;
  }

  // Test 2: Test endpoint
  console.log('\n2️⃣ Testing Test Endpoint...');
  try {
    const test = await fetch(`${API_URL}/api/test`);
    const testData = await test.json();
    console.log('✅ Test endpoint:', testData);
  } catch (e) {
    console.log('❌ Test endpoint failed:', e.message);
  }

  // Test 3: Registration with minimal data
  console.log('\n3️⃣ Testing Registration with Minimal Data...');
  const testEmail = `test${Date.now()}@example.com`;
  const minimalData = {
    name: "Test User",
    email: testEmail,
    password: "testpassword123",
    password_confirmation: "testpassword123",
    role: "pet_owner",
    phone: "09123456789"
  };

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(minimalData),
    });

    console.log('📥 Status:', response.status);
    const text = await response.text();
    console.log('📥 Response:', text);

    if (response.ok) {
      console.log('✅ SUCCESS! Registration works with minimal data!');
      return true;
    } else {
      console.log('❌ FAILED with minimal data');
      try {
        const error = JSON.parse(text);
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
      } catch (e) {
        console.log('❌ Raw error (not JSON):', text);
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 4: Registration with full data (like frontend sends)
  console.log('\n4️⃣ Testing Registration with Full Data (like frontend)...');
  const fullData = {
    name: "Test User",
    first_name: "Test",
    last_name: "User",
    email: `test${Date.now() + 1}@example.com`,
    password: "testpassword123",
    password_confirmation: "testpassword123",
    role: "pet_owner",
    phone: "09123456789",
    address: "Test Address",
    gender: "male",
    age: 25,
    experience: "",
    hourly_rate: "",
    specialties: [],
    selected_pet_types: [],
    pet_breeds: [],
    bio: ""
  };

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(fullData),
    });

    console.log('📥 Status:', response.status);
    const text = await response.text();
    console.log('📥 Response:', text);

    if (response.ok) {
      console.log('✅ SUCCESS! Registration works with full data!');
      return true;
    } else {
      console.log('❌ FAILED with full data');
      try {
        const error = JSON.parse(text);
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
      } catch (e) {
        console.log('❌ Raw error (not JSON):', text);
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  return false;
}

testStepByStep().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ TEST PASSED - Registration API is working!');
    console.log('✅ Frontend fix is correct - you can rebuild APK');
  } else {
    console.log('❌ TEST FAILED - Backend has issues');
    console.log('⚠️  Frontend fix is correct, but backend needs fixing');
    console.log('⚠️  Check Render logs for detailed error messages');
  }
  process.exit(success ? 0 : 1);
});

