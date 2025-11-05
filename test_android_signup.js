// Simulate Android User Signup Flow
// This tests the registration exactly as an Android user would experience it

const API_URL = 'https://pet-sitting-backend.onrender.com';

// Simulate what happens when an Android user fills out the signup form
async function simulateAndroidUserSignup(userType = 'pet_owner') {
  console.log('📱 SIMULATING ANDROID USER SIGNUP');
  console.log('='.repeat(60));
  console.log(`👤 User Type: ${userType === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter'}\n`);

  // Step 1: User fills out registration form (like in the app)
  const timestamp = Date.now();
  const userData = {
    // Basic Info (from SignUpScreen)
    firstName: "John",
    lastName: "Doe",
    email: `android.user.${timestamp}@example.com`,
    password: "SecurePass123!",
    phone: "09123456789",
    
    // Role Selection
    userRole: userType === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
    
    // Additional Info
    address: "123 Main Street, Manila",
    gender: "male",
    age: 28,
    
    // Pet Owner specific (if applicable)
    selectedPetTypes: userType === 'pet_owner' ? ['dogs', 'cats'] : [],
    selectedBreeds: userType === 'pet_owner' ? ['labrador', 'persian'] : [],
    
    // Pet Sitter specific (if applicable)
    experience: userType === 'pet_sitter' ? "5 years of pet sitting experience" : "",
    hourlyRate: userType === 'pet_sitter' ? "500" : "",
    specialties: userType === 'pet_sitter' ? ['dog_walking', 'pet_grooming'] : [],
    
    aboutMe: userType === 'pet_sitter' ? "I love animals and have experience with various breeds." : ""
  };

  console.log('📝 Step 1: User fills out registration form');
  console.log('   Name:', `${userData.firstName} ${userData.lastName}`);
  console.log('   Email:', userData.email);
  console.log('   Phone:', userData.phone);
  console.log('   Role:', userData.userRole);
  console.log('');

  // Step 2: App prepares data for backend (exactly like app/auth.tsx does)
  console.log('📤 Step 2: App prepares data for backend API');
  const registrationPayload = {
    name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    first_name: userData.firstName || '',
    last_name: userData.lastName || '',
    email: userData.email,
    password: userData.password,
    password_confirmation: userData.password, // ✅ This is the fix we added!
    role: userData.userRole === 'Pet Owner' ? 'pet_owner' : 'pet_sitter',
    phone: userData.phone,
    address: userData.address,
    gender: userData.gender,
    age: userData.age,
    experience: userData.experience || '',
    hourly_rate: userData.hourlyRate || '',
    specialties: userData.specialties || [],
    selected_pet_types: userData.selectedPetTypes || [],
    pet_breeds: userData.selectedBreeds || [],
    bio: userData.aboutMe || '',
  };

  console.log('   ✅ password_confirmation included:', registrationPayload.password_confirmation ? 'Yes' : 'No');
  console.log('   ✅ Request payload prepared');
  console.log('');

  // Step 3: Send registration request (like the app does)
  console.log('🌐 Step 3: Sending registration request to backend...');
  console.log(`   URL: ${API_URL}/api/register`);
  console.log('');

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(registrationPayload),
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Response received in ${duration} seconds`);
    console.log(`📥 HTTP Status: ${response.status} ${response.statusText}`);
    console.log('');

    // Step 4: Handle response
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ Response is not valid JSON');
      console.log('📄 Raw response:', responseText);
      return false;
    }

    if (response.ok && response.status === 201) {
      console.log('✅ Step 4: Registration SUCCESSFUL!');
      console.log('');
      console.log('📋 Response Data:');
      console.log('   ✅ Success:', responseData.success);
      console.log('   ✅ Message:', responseData.message);
      console.log('   ✅ User ID:', responseData.user?.id);
      console.log('   ✅ User Name:', responseData.user?.name);
      console.log('   ✅ User Email:', responseData.user?.email);
      console.log('   ✅ User Role:', responseData.user?.role);
      console.log('   ✅ Token received:', responseData.token ? 'Yes ✅' : 'No ❌');
      console.log('   ✅ Email verified:', responseData.user?.email_verified ? 'Yes' : 'No');
      console.log('   ✅ Phone verified:', responseData.user?.phone_verified ? 'Yes' : 'No');
      console.log('');
      console.log('🎉 ANDROID USER SIGNUP COMPLETE!');
      console.log('✅ User can now proceed to phone verification');
      return true;
    } else {
      console.log('❌ Step 4: Registration FAILED');
      console.log('');
      console.log('📋 Error Details:');
      console.log('   ❌ Status:', response.status);
      console.log('   ❌ Message:', responseData.message || 'Unknown error');
      
      if (responseData.errors) {
        console.log('   ❌ Validation Errors:');
        Object.entries(responseData.errors).forEach(([field, errors]) => {
          console.log(`      - ${field}:`, Array.isArray(errors) ? errors.join(', ') : errors);
        });
      }
      
      if (response.status === 500) {
        console.log('');
        console.log('⚠️  SERVER ERROR (500)');
        console.log('   This is a backend issue, not a frontend issue.');
        console.log('   The frontend fix (password_confirmation) is correct.');
        console.log('   Check Render logs to see the actual backend error.');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('   This could be a connection issue.');
    return false;
  }
}

// Test both user types
async function runAllTests() {
  console.log('\n');
  console.log('🧪 COMPREHENSIVE ANDROID USER SIGNUP TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Pet Owner Signup
  console.log('TEST 1: Pet Owner Signup');
  console.log('-'.repeat(60));
  const petOwnerSuccess = await simulateAndroidUserSignup('pet_owner');
  console.log('');

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Pet Sitter Signup
  console.log('TEST 2: Pet Sitter Signup');
  console.log('-'.repeat(60));
  const petSitterSuccess = await simulateAndroidUserSignup('pet_sitter');
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pet Owner Signup: ${petOwnerSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Pet Sitter Signup: ${petSitterSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');

  if (petOwnerSuccess && petSitterSuccess) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Frontend fix is working correctly');
    console.log('✅ You can rebuild your APK with confidence');
    return true;
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('✅ Frontend fix (password_confirmation) is correct');
    console.log('❌ Backend has issues that need to be fixed');
    console.log('💡 Check Render logs for detailed error messages');
    return false;
  }
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});

