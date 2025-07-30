@extends('layouts.app')

@section('content')
    <div class="flex items-center justify-center h-screen">
        <div class="w-full max-w-md">
            <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 class="text-center text-2xl font-bold mb-4">Log in</h2>

                <form action="#" method="POST">
                    <div class="mb-4">
                        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>

                    <div class="mb-4">
                        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="password" name="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>

                    <div class="flex items-center justify-between">
                        <button type="submit" class="w-full bg-indigo-500 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-600 focus:outline-none focus:ring-indigo-500 focus:ring-offset-indigo-200">Log in</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection