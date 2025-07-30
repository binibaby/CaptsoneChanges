@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">System Settings</h1>
            <p class="mt-2 text-sm text-gray-700">Configure and manage system-wide settings.</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- General Settings -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">General Settings</h3>
                <p class="mt-1 text-sm text-gray-600">Basic application configuration</p>
            </div>
            <form action="{{ route('admin.settings.general') }}" method="POST" class="p-6 space-y-4">
                @csrf
                <div>
                    <label for="app_name" class="block text-sm font-medium text-gray-700">Application Name</label>
                    <input type="text" name="app_name" id="app_name" value="Pet Sit Connect" 
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div>
                    <label for="admin_email" class="block text-sm font-medium text-gray-700">Admin Email</label>
                    <input type="email" name="admin_email" id="admin_email" value="admin@petsitconnect.com" 
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div>
                    <label for="timezone" class="block text-sm font-medium text-gray-700">Default Timezone</label>
                    <select name="timezone" id="timezone" 
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Asia/Manila" selected>Manila Time</option>
                    </select>
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Update General Settings
                </button>
            </form>
        </div>

        <!-- Payment Settings -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Payment Settings</h3>
                <p class="mt-1 text-sm text-gray-600">Configure payment processing</p>
            </div>
            <form action="{{ route('admin.settings.payment') }}" method="POST" class="p-6 space-y-4">
                @csrf
                <div>
                    <label for="platform_fee" class="block text-sm font-medium text-gray-700">Platform Fee (%)</label>
                    <input type="number" name="platform_fee" id="platform_fee" value="20" min="0" max="100" step="0.1"
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div>
                    <label for="stripe_key" class="block text-sm font-medium text-gray-700">Stripe Publishable Key</label>
                    <input type="text" name="stripe_key" id="stripe_key" placeholder="pk_test_..." 
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div>
                    <label for="stripe_secret" class="block text-sm font-medium text-gray-700">Stripe Secret Key</label>
                    <input type="password" name="stripe_secret" id="stripe_secret" placeholder="sk_test_..." 
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="gcash_enabled" id="gcash_enabled" checked
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="gcash_enabled" class="ml-2 block text-sm text-gray-900">Enable GCash Payment</label>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="maya_enabled" id="maya_enabled" checked
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="maya_enabled" class="ml-2 block text-sm text-gray-900">Enable Maya Payment</label>
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Update Payment Settings
                </button>
            </form>
        </div>

        <!-- Notification Settings -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Notification Settings</h3>
                <p class="mt-1 text-sm text-gray-600">Configure notification preferences</p>
            </div>
            <form action="{{ route('admin.settings.notification') }}" method="POST" class="p-6 space-y-4">
                @csrf
                <div class="flex items-center">
                    <input type="checkbox" name="email_notifications" id="email_notifications" checked
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="email_notifications" class="ml-2 block text-sm text-gray-900">Enable Email Notifications</label>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="sms_notifications" id="sms_notifications"
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="sms_notifications" class="ml-2 block text-sm text-gray-900">Enable SMS Notifications</label>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="push_notifications" id="push_notifications" checked
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="push_notifications" class="ml-2 block text-sm text-gray-900">Enable Push Notifications</label>
                </div>
                
                <div>
                    <label for="notification_frequency" class="block text-sm font-medium text-gray-700">Notification Frequency</label>
                    <select name="notification_frequency" id="notification_frequency" 
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily" selected>Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Update Notification Settings
                </button>
            </form>
        </div>

        <!-- Security Settings -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Security Settings</h3>
                <p class="mt-1 text-sm text-gray-600">Configure security and access controls</p>
            </div>
            <div class="p-6 space-y-4">
                <div class="flex items-center">
                    <input type="checkbox" name="two_factor" id="two_factor"
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="two_factor" class="ml-2 block text-sm text-gray-900">Require Two-Factor Authentication</label>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" name="auto_logout" id="auto_logout" checked
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="auto_logout" class="ml-2 block text-sm text-gray-900">Auto-logout after inactivity</label>
                </div>
                
                <div>
                    <label for="session_timeout" class="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input type="number" name="session_timeout" id="session_timeout" value="120" min="15" max="1440"
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                
                <div>
                    <label for="password_policy" class="block text-sm font-medium text-gray-700">Password Policy</label>
                    <select name="password_policy" id="password_policy" 
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="basic">Basic (8+ characters)</option>
                        <option value="strong" selected>Strong (8+ chars, mixed case, numbers)</option>
                        <option value="very_strong">Very Strong (12+ chars, symbols required)</option>
                    </select>
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Update Security Settings
                </button>
            </div>
        </div>
    </div>

    @if(session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
        </div>
    @endif
</div>
@endsection 
 