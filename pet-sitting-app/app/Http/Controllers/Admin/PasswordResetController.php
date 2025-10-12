<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class PasswordResetController extends Controller
{
    /**
     * Display the password reset page with user list
     */
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->paginate(20);
        return view('admin.password-reset.index', compact('users'));
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
                'new_password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            ], [
                'email.required' => 'Email is required',
                'email.email' => 'Please enter a valid email address',
                'email.exists' => 'No user found with this email address',
                'new_password.required' => 'New password is required',
                'new_password.min' => 'Password must be at least 8 characters long',
                'new_password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 400);
            }

            $email = $request->email;
            $newPassword = $request->new_password;

            // Find user by email
            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Update password
            $user->password = Hash::make($newPassword);
            $user->save();

            // Log password reset activity
            \Log::info("🔐 Admin password reset completed:", [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
                'reset_by' => auth()->user()->email ?? 'admin',
                'reset_at' => now()->toISOString(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role,
                    'reset_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ Admin password reset error:', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'unknown',
                'admin' => auth()->user()->email ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error resetting password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search users by email
     */
    public function searchUser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please enter a valid email address'
                ], 400);
            }

            $email = $request->email;
            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No user found with this email address'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'last_active_at' => $user->last_active_at ? $user->last_active_at->format('Y-m-d H:i:s') : 'Never'
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ User search error:', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error searching user: ' . $e->getMessage()
            ], 500);
        }
    }
}
