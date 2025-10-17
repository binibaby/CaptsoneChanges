@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div class="relative px-8 py-12">
            <div class="flex items-center justify-between">
                <div class="text-gray-900">
                    <h1 class="text-4xl font-bold mb-2">Analytics Dashboard</h1>
                    <p class="text-gray-600 text-lg">Track user growth and revenue trends with detailed insights.</p>
                    <div class="flex items-center mt-4 space-x-4">
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            <span class="text-sm">Real-time analytics and insights</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
                <h3 class="text-lg font-semibold text-gray-900">Filter Data</h3>
                <div class="flex items-center space-x-2">
                    <label for="period" class="text-sm font-medium text-gray-700">Period:</label>
                    <select id="period" name="period" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly" selected>Monthly</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
                <div class="flex items-center space-x-2">
                    <label for="start_date" class="text-sm font-medium text-gray-700">From:</label>
                    <input type="date" id="start_date" name="start_date" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div class="flex items-center space-x-2">
                    <label for="end_date" class="text-sm font-medium text-gray-700">To:</label>
                    <input type="date" id="end_date" name="end_date" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button id="applyFilters" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    <span>Apply Filters</span>
                </button>
                <button id="exportData" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Export CSV</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Users -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Users</p>
                    <p class="text-3xl font-bold text-gray-900" id="totalUsers">0</p>
                    <p class="text-sm text-green-600" id="userGrowthRate">+0%</p>
                </div>
            </div>
        </div>

        <!-- Total Revenue -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p class="text-3xl font-bold text-gray-900" id="totalRevenue">$0</p>
                    <p class="text-sm text-green-600" id="revenueGrowthRate">+0%</p>
                </div>
            </div>
        </div>

        <!-- App Earnings -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">App Earnings</p>
                    <p class="text-3xl font-bold text-gray-900" id="appEarnings">$0</p>
                    <p class="text-sm text-blue-600">Platform Share</p>
                </div>
            </div>
        </div>

        <!-- Total Bookings -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p class="text-3xl font-bold text-gray-900" id="totalBookings">0</p>
                    <p class="text-sm text-orange-600" id="bookingCompletionRate">0% Complete</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- User Growth Chart -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">User Growth</h3>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span class="text-sm text-gray-600">Total Users</span>
                    <div class="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Owners</span>
                    <div class="w-3 h-3 bg-purple-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Sitters</span>
                </div>
            </div>
            <div class="h-80">
                <canvas id="userGrowthChart"></canvas>
            </div>
        </div>

        <!-- Revenue Chart -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">Revenue Trends</h3>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm text-gray-600">Total Revenue</span>
                    <div class="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">App Earnings</span>
                </div>
            </div>
            <div class="h-80">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <!-- Booking Trends Chart -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">Booking Trends</h3>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span class="text-sm text-gray-600">Total Bookings</span>
                    <div class="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Completed</span>
                    <div class="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Cancelled</span>
                </div>
            </div>
            <div class="h-80">
                <canvas id="bookingChart"></canvas>
            </div>
        </div>

        <!-- Verification Trends Chart -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">Verification Trends</h3>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span class="text-sm text-gray-600">Total Verifications</span>
                    <div class="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Approved</span>
                    <div class="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                    <span class="text-sm text-gray-600">Rejected</span>
                </div>
            </div>
            <div class="h-80">
                <canvas id="verificationChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span class="text-gray-700">Loading analytics data...</span>
        </div>
    </div>
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
let userGrowthChart, revenueChart, bookingChart, verificationChart;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Set default date range first
    setDefaultDateRange();
    
    // Load initial data
    loadAnalyticsData();
    
    // Set up event listeners
    document.getElementById('applyFilters').addEventListener('click', function() {
        console.log('Apply filters clicked');
        loadAnalyticsData();
    });
    
    document.getElementById('exportData').addEventListener('click', function() {
        exportData();
    });
});

function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    document.getElementById('end_date').value = endDate.toISOString().split('T')[0];
    document.getElementById('start_date').value = startDate.toISOString().split('T')[0];
}

function initializeCharts() {
    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
    userGrowthChart = new Chart(userGrowthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Users',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }, {
                label: 'Owners',
                data: [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4
            }, {
                label: 'Sitters',
                data: [],
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Revenue',
                data: [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4
            }, {
                label: 'App Earnings',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Booking Chart
    const bookingCtx = document.getElementById('bookingChart').getContext('2d');
    bookingChart = new Chart(bookingCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Bookings',
                data: [],
                backgroundColor: 'rgba(249, 115, 22, 0.8)',
                borderColor: 'rgb(249, 115, 22)',
                borderWidth: 1
            }, {
                label: 'Completed',
                data: [],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }, {
                label: 'Cancelled',
                data: [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Verification Chart
    const verificationCtx = document.getElementById('verificationChart').getContext('2d');
    verificationChart = new Chart(verificationCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Verifications',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }, {
                label: 'Approved',
                data: [],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }, {
                label: 'Rejected',
                data: [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadAnalyticsData() {
    console.log('Loading analytics data...');
    showLoading();
    
    const period = document.getElementById('period').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    
    console.log('Filter parameters:', { period, startDate, endDate });
    
    const params = new URLSearchParams({
        period: period,
        start_date: startDate,
        end_date: endDate
    });
    
    const url = `{{ route('admin.analytics.data') }}?${params}`;
    console.log('Fetching from URL:', url);
    
    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Analytics data received:', data);
            updateSummaryCards(data);
            updateCharts(data);
            hideLoading();
        })
        .catch(error => {
            console.error('Error loading analytics data:', error);
            hideLoading();
        });
}

function updateSummaryCards(data) {
    console.log('Updating summary cards with data:', data);
    
    // Handle the nested data structure
    const totals = data.totals || {};
    const growthRates = data.growth_rates || {};
    
    console.log('Totals:', totals);
    console.log('Growth rates:', growthRates);
    
    document.getElementById('totalUsers').textContent = (totals.users || 0).toLocaleString();
    document.getElementById('totalRevenue').textContent = '$' + (totals.revenue || 0).toLocaleString();
    document.getElementById('appEarnings').textContent = '$' + (totals.app_earnings || 0).toLocaleString();
    document.getElementById('totalBookings').textContent = (totals.bookings || 0).toLocaleString();
    
    document.getElementById('userGrowthRate').textContent = '+' + (growthRates.users || 0) + '%';
    document.getElementById('revenueGrowthRate').textContent = '+' + (growthRates.revenue || 0) + '%';
    
    // Calculate completion rate properly
    const completedBookings = data.booking_data ? 
        data.booking_data.reduce((sum, item) => sum + (item.completed_bookings || 0), 0) : 0;
    const totalBookings = totals.bookings || 0;
    const completionRate = totalBookings > 0 ? 
        Math.round((completedBookings / totalBookings) * 100) : 0;
    document.getElementById('bookingCompletionRate').textContent = completionRate + '% Complete';
    
    console.log('Summary cards updated');
}

function updateCharts(data) {
    // Update User Growth Chart
    const userGrowthData = data.user_growth || [];
    userGrowthChart.data.labels = userGrowthData.map(item => item.period);
    userGrowthChart.data.datasets[0].data = userGrowthData.map(item => item.total_users || 0);
    userGrowthChart.data.datasets[1].data = userGrowthData.map(item => item.owners || 0);
    userGrowthChart.data.datasets[2].data = userGrowthData.map(item => item.sitters || 0);
    userGrowthChart.update();
    
    // Update Revenue Chart
    const revenueData = data.revenue_data || [];
    revenueChart.data.labels = revenueData.map(item => item.period);
    revenueChart.data.datasets[0].data = revenueData.map(item => item.total_revenue || 0);
    revenueChart.data.datasets[1].data = revenueData.map(item => item.app_share || 0);
    revenueChart.update();
    
    // Update Booking Chart
    const bookingData = data.booking_data || [];
    bookingChart.data.labels = bookingData.map(item => item.period);
    bookingChart.data.datasets[0].data = bookingData.map(item => item.total_bookings || 0);
    bookingChart.data.datasets[1].data = bookingData.map(item => item.completed_bookings || 0);
    bookingChart.data.datasets[2].data = bookingData.map(item => item.cancelled_bookings || 0);
    bookingChart.update();
    
    // Update Verification Chart
    const verificationData = data.verification_data || [];
    verificationChart.data.labels = verificationData.map(item => item.period);
    verificationChart.data.datasets[0].data = verificationData.map(item => item.total_verifications || 0);
    verificationChart.data.datasets[1].data = verificationData.map(item => item.approved_verifications || 0);
    verificationChart.data.datasets[2].data = verificationData.map(item => item.rejected_verifications || 0);
    verificationChart.update();
}

function exportData() {
    const period = document.getElementById('period').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    
    const params = new URLSearchParams({
        period: period,
        start_date: startDate,
        end_date: endDate
    });
    
    window.open(`{{ route('admin.analytics.export') }}?${params}`, '_blank');
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}
</script>
@endpush
@endsection
