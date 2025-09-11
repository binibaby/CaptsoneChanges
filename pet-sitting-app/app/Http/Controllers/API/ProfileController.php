<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $request->validate([
                'name' => 'sometimes|string|max:255',
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:500',
                'gender' => 'sometimes|in:male,female,other',
                'age' => 'sometimes|integer|min:1|max:120',
                'experience' => 'sometimes|string|max:500',
                'hourly_rate' => 'sometimes|numeric|min:0|max:999999.99',
                'bio' => 'sometimes|string|max:1000',
                'profile_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:5120',
            ]);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $file = $request->file('profile_image');
                $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('profile_images', $filename, 'public');
                $profileImageUrl = Storage::disk('public')->url($path);
                
                // Delete old profile image if exists
                if ($user->profile_image) {
                    $oldPath = str_replace('/storage/', '', $user->profile_image);
                    Storage::disk('public')->delete($oldPath);
                }
                
                $user->profile_image = $profileImageUrl;
                
                Log::info('📸 Profile image uploaded for user ' . $user->id . ': ' . $filename);
            }

            // Update other profile fields
            $updateData = $request->only([
                'name', 'first_name', 'last_name', 'phone', 'address', 
                'gender', 'age', 'experience', 'hourly_rate', 'bio'
            ]);

            foreach ($updateData as $key => $value) {
                if ($value !== null) {
                    $user->$key = $value;
                }
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'gender' => $user->gender,
                    'age' => $user->age,
                    'experience' => $user->experience,
                    'hourly_rate' => $user->hourly_rate,
                    'bio' => $user->bio,
                    'profile_image' => $user->profile_image,
                    'role' => $user->role,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadProfileImage(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $request->validate([
                'profile_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            ]);

            $file = $request->file('profile_image');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('profile_images', $filename, 'public');
            $profileImageUrl = Storage::disk('public')->url($path);
            
            // Delete old profile image if exists
            if ($user->profile_image) {
                $oldPath = str_replace('/storage/', '', $user->profile_image);
                Storage::disk('public')->delete($oldPath);
            }
            
            $user->profile_image = $profileImageUrl;
            $user->save();

            Log::info('📸 Profile image uploaded for user ' . $user->id . ': ' . $filename);

            return response()->json([
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'profile_image' => $profileImageUrl
            ]);

        } catch (\Exception $e) {
            Log::error('Profile image upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile image: ' . $e->getMessage()
            ], 500);
        }
    }
}
