#!/usr/bin/env node

/**
 * Debug script for messaging authentication issues
 * Run this with: node debug_messaging.js
 */

const ReverbMessagingService = require('./src/services/reverbMessagingService').default;
const AuthService = require('./src/services/authService').default;
const NetworkService = require('./src/services/networkService').default;

async function debugMessaging() {
    console.log('🔍 Starting messaging debug...\n');

    try {
        // Initialize services
        const authService = AuthService.getInstance();
        const reverbMessagingService = ReverbMessagingService.getInstance();
        const networkService = NetworkService.getInstance();

        console.log('1. Checking authentication status...');
        await reverbMessagingService.debugAuthStatus();

        console.log('\n2. Testing token retrieval...');
        await reverbMessagingService.debugTokenRetrieval();

        console.log('\n3. Testing basic API call...');
        await reverbMessagingService.debugApiCall();

        console.log('\n4. Testing conversations API...');
        try {
            const conversations = await reverbMessagingService.getConversations();
            console.log('✅ Conversations loaded successfully:', conversations.length);
        } catch (error) {
            console.error('❌ Conversations failed:', error.message);
        }

        console.log('\n5. Testing send message (with dummy data)...');
        try {
            const message = await reverbMessagingService.sendMessage('test_receiver', 'Test message', 'text');
            console.log('✅ Message sent successfully:', message.id);
        } catch (error) {
            console.error('❌ Send message failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Debug script error:', error);
    }

    console.log('\n🔍 Debug complete!');
}

// Run the debug
debugMessaging().catch(console.error);
