<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
            ], 401);
        }

        // Check if user is banned
        if ($user->status === 'banned') {
            $adminEmail = 'petsitconnectph@gmail.com';
            return response()->json([
                'success' => false,
                'message' => "Your account has been permanently banned. You will not be able to use the platform anymore. Please contact the admin at {$adminEmail} if you have any questions.",
                'status' => 'banned',
                'admin_email' => $adminEmail,
            ], 403);
        }

        // Check if user is suspended
        if ($user->status === 'suspended') {
            $adminEmail = 'petsitconnectph@gmail.com';
            $suspensionEnd = $user->suspension_ends_at;
            
            // Check if suspension period has ended
            if ($suspensionEnd && now()->gte($suspensionEnd)) {
                // Suspension period has ended, reactivate user
                $user->update([
                    'status' => 'active',
                    'suspended_at' => null,
                    'suspended_by' => null,
                    'suspension_reason' => null,
                    'suspension_ends_at' => null,
                ]);
            } else {
                // User is still suspended
                $hoursRemaining = $suspensionEnd ? now()->diffInHours($suspensionEnd) : 72;
                return response()->json([
                    'success' => false,
                    'message' => "You have been suspended for 72 hours by the admin. Please email the admin at {$adminEmail} for assistance. Your suspension will end in approximately {$hoursRemaining} hours.",
                    'status' => 'suspended',
                    'admin_email' => $adminEmail,
                ], 403);
            }
        }

        return $next($request);
    }
}

