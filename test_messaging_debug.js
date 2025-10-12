#!/usr/bin/env node

/**
 * Test script to debug messaging service token retrieval and API calls
 * This script can be run to test the messaging service without the mobile app
 */

const { ReverbMessagingService } = require('./src/services/reverbMessagingService');

async function testMessagingService() {
  console.log('🔍 Starting messaging service debug test...');
  
  try {
    // Create an instance of the messaging service
    const messagingService = ReverbMessagingService.getInstance();
    
    // Test token retrieval
    console.log('\n1. Testing token retrieval...');
    await messagingService.debugTokenRetrieval();
    
    // Test API call
    console.log('\n2. Testing API call...');
    await messagingService.debugApiCall();
    
    // Test conversations API
    console.log('\n3. Testing conversations API...');
    try {
      const conversations = await messagingService.getConversations();
      console.log('✅ Conversations loaded successfully:', conversations.length, 'conversations');
    } catch (error) {
      console.error('❌ Conversations API failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMessagingService().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('❌ Test error:', error);
});
