<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Verification;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Get dashboard statistics
        $stats = $this->getDashboardStats();
        
        // Get recent activities
        $recentActivities = $this->getRecentActivities();
        
        // Get charts data
        $chartsData = $this->getChartsData();
        
        return view('admin.dashboard', compact('stats', 'recentActivities', 'chartsData'));
    }

    public function reportsIndex()
    {
        // Get dashboard statistics for reports overview
        $stats = $this->getDashboardStats();
        
        return view('admin.reports.index', compact('stats'));
    }

    public function announcements()
    {
        return view('admin.announcements');
    }

    private function getDashboardStats()
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        
        return [
            'total_users' => User::count(),
            'total_pet_owners' => User::where('role', 'pet_owner')->count(),
            'total_pet_sitters' => User::where('role', 'pet_sitter')->count(),
            'total_bookings' => Booking::count(),
            'active_bookings' => Booking::where('status', 'confirmed')->count(),
            'pending_verifications' => Verification::where('status', 'pending')->count(),
            'total_revenue' => Payment::where('status', 'paid')->sum('amount'),
            'monthly_revenue' => Payment::where('status', 'paid')
                ->whereBetween('created_at', [$lastMonth, $now])
                ->sum('amount'),
            'platform_fees' => Payment::where('status', 'paid')->sum('app_share'),
            'average_rating' => User::where('role', 'pet_sitter')->avg('rating') ?? 0,
            'new_users_this_month' => User::whereBetween('created_at', [$lastMonth, $now])->count(),
            'new_bookings_this_month' => Booking::whereBetween('created_at', [$lastMonth, $now])->count(),
        ];
    }

    private function getRecentActivities()
    {
        return [
            'recent_users' => User::latest()->take(5)->get(),
            'recent_bookings' => Booking::with(['user', 'sitter'])->latest()->take(5)->get(),
            'recent_payments' => Payment::with(['booking.user'])->latest()->take(5)->get(),
            'recent_verifications' => Verification::with(['user'])->latest()->take(5)->get(),
        ];
    }

    private function getChartsData()
    {
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $last7Days->push([
                'date' => $date->format('M d'),
                'users' => User::whereRaw('DATE(created_at) = ?', [$date->toDateString()])->count(),
                'bookings' => Booking::whereRaw('DATE(created_at) = ?', [$date->toDateString()])->count(),
                'revenue' => Payment::where('status', 'completed')
                    ->whereRaw('DATE(created_at) = ?', [$date->toDateString()])
                    ->sum('amount'),
            ]);
        }

        $monthlyData = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthlyData->push([
                'month' => $date->format('M Y'),
                'users' => User::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'bookings' => Booking::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'revenue' => Payment::where('status', 'completed')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('amount'),
            ]);
        }

        return [
            'daily_stats' => $last7Days,
            'monthly_stats' => $monthlyData,
            'user_types' => [
                'pet_owners' => User::where('role', 'pet_owner')->count(),
                'pet_sitters' => User::where('role', 'pet_sitter')->count(),
            ],
            'booking_statuses' => Booking::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'payment_methods' => Payment::select('method', DB::raw('count(*) as count'))
                ->groupBy('method')
                ->pluck('count', 'method'),
        ];
    }

    public function exportStats(Request $request)
    {
        $type = $request->get('type', 'users');
        $dateRange = $request->get('date_range', 'last_30_days');
        
        $data = $this->getExportData($type, $dateRange);
        
        return response()->json($data);
    }

    private function getExportData($type, $dateRange)
    {
        $startDate = $this->getStartDate($dateRange);
        $endDate = Carbon::now();

        switch ($type) {
            case 'users':
                return User::whereBetween('created_at', [$startDate, $endDate])
                    ->select('id', 'name', 'email', 'role', 'created_at', 'status')
                    ->get();
            
            case 'bookings':
                return Booking::whereBetween('created_at', [$startDate, $endDate])
                    ->with(['petOwner', 'petSitter'])
                    ->get();
            
            case 'payments':
                return Payment::whereBetween('created_at', [$startDate, $endDate])
                    ->with(['user'])
                    ->get();
            
            case 'verifications':
                return Verification::whereBetween('created_at', [$startDate, $endDate])
                    ->with(['user'])
                    ->get();
            
            default:
                return collect();
        }
    }

    private function getStartDate($dateRange)
    {
        switch ($dateRange) {
            case 'last_7_days':
                return Carbon::now()->subDays(7);
            case 'last_30_days':
                return Carbon::now()->subDays(30);
            case 'last_90_days':
                return Carbon::now()->subDays(90);
            case 'this_year':
                return Carbon::now()->startOfYear();
            default:
                return Carbon::now()->subDays(30);
        }
    }
}
