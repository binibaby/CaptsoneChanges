<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }} - Admin</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <style>
        .sidebar-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-collapsed {
            width: 4rem;
        }
        .sidebar-expanded {
            width: 16rem;
        }
        .content-expanded {
            margin-left: 16rem;
        }
        .content-collapsed {
            margin-left: 4rem;
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f8fafc;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
            border: 1px solid #f1f5f9;
            transition: background-color 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
            background: #64748b;
        }
        
        /* Show scrollbar on hover */
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
        }
        .custom-scrollbar:hover {
            scrollbar-color: #cbd5e1 #f8fafc;
        }
        
        /* Ensure sidebar navigation is scrollable */
        .sidebar-nav {
            max-height: calc(100vh - 8rem);
            overflow-y: auto;
            overflow-x: hidden;
            padding-bottom: 2rem;
            position: relative;
        }
        
        /* Add subtle fade effect to indicate scrollable content */
        .sidebar-nav::after {
            content: '';
            position: sticky;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2rem;
            background: linear-gradient(transparent, rgba(255, 255, 255, 0.8));
            pointer-events: none;
            z-index: 10;
        }
        
        /* Removed glass effect to show colors */
        
        /* Gradient backgrounds */
        .gradient-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .gradient-secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .gradient-success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .gradient-warning {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        
        /* Hover effects */
        .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Animation keyframes */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
    </style>
</head>
<body class="font-sans antialiased bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <div id="sidebar" class="sidebar-expanded sidebar-transition bg-white text-gray-900 fixed h-full z-50 shadow-2xl border-r border-gray-200">
            <!-- Brand -->
            <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                        <span class="text-white font-bold text-sm">PS</span>
                    </div>
                    <span id="brand-text" class="text-xl font-bold text-gray-900 tracking-tight">PetSitConnect</span>
                </div>
                <button id="sidebar-toggle" class="text-gray-500 hover:text-gray-700 transition-all duration-200 p-1 rounded-lg hover:bg-gray-100">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>

            <!-- Navigation -->
            <nav class="mt-6 px-4 custom-scrollbar sidebar-nav">
                <!-- Dashboard -->
                <div class="mb-3">
                    <a href="{{ route('admin.dashboard') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.dashboard') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v14m8-14v14"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Dashboard</span>
                    </a>
                </div>

                <!-- Users -->
                <div class="mb-3">
                    <a href="{{ route('admin.users.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.users.*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Users</span>
                    </a>
                </div>

                <!-- Name Updates -->
                <div class="mb-3">
                    <a href="{{ route('admin.name-updates.users') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.name-updates.*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Name Updates</span>
                    </a>
                </div>

                <!-- Profile Update Requests -->
                <div class="mb-3">
                    <a href="{{ route('admin.profile-update-requests.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.profile-update-requests.*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Profile Requests</span>
                    </a>
                </div>


                <!-- Verifications -->
                <div class="mb-3">
                    <a href="{{ route('admin.verifications.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.verifications.index') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Verifications</span>
                    </a>
                </div>

                <!-- ID Access -->
                <div class="mb-3">
                    <a href="{{ route('admin.verifications.id-access') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.verifications.id-access') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">ID Access</span>
                    </a>
                </div>

                <!-- Password Reset -->
                <div class="mb-3">
                    <a href="{{ route('admin.password-reset.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.password-reset.*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Password Reset</span>
                    </a>
                </div>





                <!-- Analytics -->
                <div class="mb-3">
                    <a href="{{ route('admin.analytics.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.analytics*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Analytics</span>
                    </a>
                </div>

                <!-- Announcements -->
                <div class="mb-3">
                    <a href="{{ route('admin.announcements') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.announcements*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Announcements</span>
                    </a>
                </div>

                <!-- Settings -->
                <div class="mb-3">
                    <a href="{{ route('admin.settings.index') }}" 
                       class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                              {{ request()->routeIs('admin.settings.*') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }}">
                        <svg class="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span id="nav-text" class="font-medium">Settings</span>
                    </a>
                </div>
            </nav>
        </div>

        <!-- Main Content -->
        <div id="main-content" class="content-expanded sidebar-transition flex-1">
            <!-- Top Header -->
            <header class="bg-gradient-to-r from-blue-100 to-indigo-200 shadow-lg border-b border-blue-300">
                <div class="flex items-center justify-between h-16 px-6">
                    <!-- Breadcrumb -->
                    <div class="flex items-center space-x-2 text-sm">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                            </div>
                            <span class="text-blue-700 font-medium">Admin Panel</span>
                        </div>
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        <span class="text-blue-900 font-bold text-lg bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200">{{ ucfirst(str_replace(['admin.', '.'], ['', ' '], request()->route()?->getName() ?? 'Dashboard')) }}</span>
                    </div>

                    <!-- Right Side -->
                    <div class="flex items-center space-x-4">
                        <!-- Search -->
                        <div class="relative hidden md:block">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input type="text" placeholder="Search..." class="block w-64 pl-10 pr-3 py-2 bg-white border border-blue-300 rounded-lg text-sm placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                        </div>

                        <!-- Notifications -->
                        <button class="relative p-2 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:bg-white rounded-lg shadow-sm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <!-- User Menu -->
                        <div class="flex items-center space-x-3 pl-3 border-l border-blue-300">
                            <div class="text-right">
                                <div class="text-sm font-semibold text-blue-900">{{ Auth::user()->name ?? 'Admin' }}</div>
                                <div class="text-xs text-blue-600">Administrator</div>
                            </div>
                            <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center shadow-lg">
                                <span class="text-white font-semibold text-sm">{{ substr(Auth::user()->name ?? 'A', 0, 1) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="p-6 bg-transparent min-h-[calc(100vh-4rem)]">
                <div class="fade-in-up">
                    @yield('content')
                </div>
            </main>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const brandText = document.getElementById('brand-text');
            const navTexts = document.querySelectorAll('#nav-text');
            
            let isCollapsed = false;

            sidebarToggle.addEventListener('click', function() {
                if (isCollapsed) {
                    // Expand sidebar
                    sidebar.classList.remove('sidebar-collapsed');
                    sidebar.classList.add('sidebar-expanded');
                    mainContent.classList.remove('content-collapsed');
                    mainContent.classList.add('content-expanded');
                    brandText.style.display = 'block';
                    navTexts.forEach(text => text.style.display = 'block');
                } else {
                    // Collapse sidebar
                    sidebar.classList.remove('sidebar-expanded');
                    sidebar.classList.add('sidebar-collapsed');
                    mainContent.classList.remove('content-expanded');
                    mainContent.classList.add('content-collapsed');
                    brandText.style.display = 'none';
                    navTexts.forEach(text => text.style.display = 'none');
                }
                isCollapsed = !isCollapsed;
            });
        });
    </script>

    <!-- Enhanced Image Modal with Zoom -->
    <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full hidden z-50">
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative max-w-6xl max-h-full bg-white rounded-lg shadow-2xl">
                <!-- Modal Header -->
                <div class="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 id="modalTitle" class="text-xl font-semibold text-gray-900"></h3>
                    <div class="flex items-center space-x-2">
                        <button id="zoomInBtn" onclick="zoomIn()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                        <button id="zoomOutBtn" onclick="zoomOut()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
                            </svg>
                        </button>
                        <button id="resetZoomBtn" onclick="resetZoom()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                        <button onclick="closeImageModal()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Modal Body with Zoomable Image -->
                <div class="p-4 overflow-auto max-h-[80vh]">
                    <div id="imageContainer" class="text-center relative">
                        <img id="modalImage" 
                             src="" 
                             alt="" 
                             class="max-w-full h-auto rounded-lg shadow-lg cursor-zoom-in transition-transform duration-200"
                             style="transform-origin: center;"
                             onclick="toggleZoom()">
                    </div>
                </div>
                
                <!-- Modal Footer -->
                <div class="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                    <div class="text-sm text-gray-500">
                        <span id="zoomLevel">100%</span> • Click image to zoom • Use buttons to control zoom
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="downloadImage()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Download
                        </button>
                        <button onclick="closeImageModal()" class="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    let currentZoom = 1;
    const maxZoom = 5;
    const minZoom = 0.5;
    const zoomStep = 0.25;

    function openImageModal(imageSrc, title) {
        document.getElementById('modalImage').src = imageSrc;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('imageModal').classList.remove('hidden');
        resetZoom();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeImageModal() {
        document.getElementById('imageModal').classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
        resetZoom();
    }

    function zoomIn() {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            updateZoom();
        }
    }

    function zoomOut() {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            updateZoom();
        }
    }

    function resetZoom() {
        currentZoom = 1;
        updateZoom();
    }

    function toggleZoom() {
        if (currentZoom === 1) {
            currentZoom = 2;
        } else {
            currentZoom = 1;
        }
        updateZoom();
    }

    function updateZoom() {
        const image = document.getElementById('modalImage');
        const zoomLevel = document.getElementById('zoomLevel');
        
        image.style.transform = `scale(${currentZoom})`;
        zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
        
        // Update button states
        document.getElementById('zoomInBtn').disabled = currentZoom >= maxZoom;
        document.getElementById('zoomOutBtn').disabled = currentZoom <= minZoom;
        
        // Update cursor
        if (currentZoom > 1) {
            image.classList.remove('cursor-zoom-in');
            image.classList.add('cursor-zoom-out');
        } else {
            image.classList.remove('cursor-zoom-out');
            image.classList.add('cursor-zoom-in');
        }
    }

    function downloadImage() {
        const image = document.getElementById('modalImage');
        const link = document.createElement('a');
        link.href = image.src;
        link.download = document.getElementById('modalTitle').textContent + '.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Close modal when clicking outside
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImageModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (!document.getElementById('imageModal').classList.contains('hidden')) {
            switch(e.key) {
                case 'Escape':
                    closeImageModal();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        }
    });

    // Prevent image drag
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    </script>

    @stack('scripts')
</body>
</html> 
 