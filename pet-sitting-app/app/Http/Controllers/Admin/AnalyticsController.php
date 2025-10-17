<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Verification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'monthly'); // daily, weekly, monthly, all
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Get analytics data based on period
        $analyticsData = $this->getAnalyticsData($period, $startDate, $endDate);
        
        return view('admin.analytics', compact('analyticsData', 'period'));
    }

    public function getData(Request $request)
    {
        $period = $request->get('period', 'monthly');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        $data = $this->getAnalyticsData($period, $startDate, $endDate);
        
        return response()->json($data);
    }

    private function getAnalyticsData($period, $startDate = null, $endDate = null)
    {
        $now = Carbon::now();
        $driver = DB::getDriverName();
        
        // Set date range based on period
        switch ($period) {
            case 'daily':
                $start = $startDate ? Carbon::parse($startDate) : $now->copy()->subDays(30);
                $end = $endDate ? Carbon::parse($endDate) : $now;
                $groupBy = $driver === 'sqlite' ? "strftime('%Y-%m-%d', created_at)" : "DATE(created_at)";
                $dateFormat = 'Y-m-d';
                break;
            case 'weekly':
                $start = $startDate ? Carbon::parse($startDate) : $now->copy()->subWeeks(12);
                $end = $endDate ? Carbon::parse($endDate) : $now;
                $groupBy = $driver === 'sqlite' ? "strftime('%Y', created_at) || '-' || strftime('%W', created_at)" : "YEARWEEK(created_at)";
                $dateFormat = 'Y-W';
                break;
            case 'monthly':
                $start = $startDate ? Carbon::parse($startDate) : $now->copy()->subMonths(12);
                $end = $endDate ? Carbon::parse($endDate) : $now;
                $groupBy = $driver === 'sqlite' ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
                $dateFormat = 'Y-m';
                break;
            case 'all':
            default:
                $start = $startDate ? Carbon::parse($startDate) : User::min('created_at');
                $end = $endDate ? Carbon::parse($endDate) : $now;
                $groupBy = $driver === 'sqlite' ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
                $dateFormat = 'Y-m';
                break;
        }

        // User Growth Data
        $userGrowth = User::selectRaw("
                {$groupBy} as period,
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'pet_owner' THEN 1 END) as owners,
                COUNT(CASE WHEN role = 'pet_sitter' THEN 1 END) as sitters
            ")
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Revenue Data
        $revenueData = Payment::selectRaw("
                {$groupBy} as period,
                COUNT(*) as total_payments,
                SUM(amount) as total_revenue,
                SUM(app_share) as app_earnings,
                AVG(amount) as avg_payment
            ")
            ->where('status', 'completed')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Booking Data
        $bookingData = Booking::selectRaw("
                {$groupBy} as period,
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                AVG(CASE WHEN status = 'completed' THEN total_amount END) as avg_booking_value
            ")
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Verification Data
        $verificationData = Verification::selectRaw("
                {$groupBy} as period,
                COUNT(*) as total_verifications,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_verifications,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_verifications
            ")
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Calculate totals and growth rates
        $totalUsers = User::count();
        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $totalAppEarnings = Payment::where('status', 'completed')->sum('app_share');
        $totalBookings = Booking::count();
        $totalVerifications = Verification::count();

        // Calculate growth rates
        $userGrowthRate = $this->calculateGrowthRate($userGrowth);
        $revenueGrowthRate = $this->calculateGrowthRate($revenueData, 'total_revenue');

        return [
            'period' => $period,
            'date_range' => [
                'start' => $start->format('Y-m-d'),
                'end' => $end->format('Y-m-d')
            ],
            'user_growth' => $userGrowth,
            'revenue_data' => $revenueData,
            'booking_data' => $bookingData,
            'verification_data' => $verificationData,
            'totals' => [
                'users' => $totalUsers,
                'revenue' => $totalRevenue,
                'app_earnings' => $totalAppEarnings,
                'bookings' => $totalBookings,
                'verifications' => $totalVerifications
            ],
            'growth_rates' => [
                'users' => $userGrowthRate,
                'revenue' => $revenueGrowthRate
            ]
        ];
    }

    private function calculateGrowthRate($data, $valueField = 'total_users')
    {
        if ($data->count() < 2) {
            return 0;
        }

        $firstValue = $data->first()->$valueField ?? 0;
        $lastValue = $data->last()->$valueField ?? 0;

        if ($firstValue == 0) {
            return $lastValue > 0 ? 100 : 0;
        }

        return round((($lastValue - $firstValue) / $firstValue) * 100, 2);
    }

    public function export(Request $request)
    {
        $period = $request->get('period', 'monthly');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        $data = $this->getAnalyticsData($period, $startDate, $endDate);
        
        // Create CSV content
        $csv = "Period,Total Users,Owners,Sitters,Total Revenue,App Earnings,Total Bookings,Completed Bookings\n";
        
        foreach ($data['user_growth'] as $index => $userData) {
            $revenueData = $data['revenue_data'][$index] ?? (object)['total_revenue' => 0, 'app_share' => 0];
            $bookingData = $data['booking_data'][$index] ?? (object)['total_bookings' => 0, 'completed_bookings' => 0];
            
            $csv .= sprintf("%s,%d,%d,%d,%.2f,%.2f,%d,%d\n",
                $userData->period,
                $userData->total_users,
                $userData->owners,
                $userData->sitters,
                $revenueData->total_revenue ?? 0,
                $revenueData->app_share ?? 0,
                $bookingData->total_bookings ?? 0,
                $bookingData->completed_bookings ?? 0
            );
        }
        
        $filename = 'analytics_' . $period . '_' . now()->format('Y-m-d') . '.csv';
        
        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
