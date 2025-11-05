// Test script to verify registration API works
// Run with: node test_registration.js

const API_URL = 'https://pet-sitting-backend.onrender.com';

async function testRegistration() {
  const testEmail = `test${Date.now()}@example.com`;
  
  const requestData = {
    name: "Test User",
    first_name: "Test",
    last_name: "User",
    email: testEmail,
    password: "testpassword123",
    password_confirmation: "testpassword123", // ✅ This is what we added
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

  console.log('🧪 Testing Registration API...');
  console.log('📤 Sending request to:', `${API_URL}/api/register`);
  console.log('📋 Request data:', JSON.stringify(requestData, null, 2));

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n✅ SUCCESS! Registration works!');
      console.log('✅ User ID:', result.user?.id);
      console.log('✅ Token received:', result.token ? 'Yes' : 'No');
      return true;
    } else {
      console.log('\n❌ FAILED! Status:', response.status);
      try {
        const error = JSON.parse(responseText);
        console.log('❌ Error message:', error.message);
        console.log('❌ Errors:', error.errors);
      } catch (e) {
        console.log('❌ Raw error:', responseText);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
    return false;
  }
}

// Run the test
testRegistration().then(success => {
  process.exit(success ? 0 : 1);
});

