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

    </div>

    @if(session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
        </div>
    @endif
</div>
@endsection 
 