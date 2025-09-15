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

            // Base validation rules for all users
            $validationRules = [
                'name' => 'sometimes|string|max:255',
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:500',
                'gender' => 'sometimes|in:male,female,other',
                'age' => 'sometimes|integer|min:1|max:120',
                'bio' => 'sometimes|string|max:1000',
                'profile_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:5120',
            ];

            // Add pet sitter specific validation rules
            if ($user->role === 'pet_sitter') {
                $validationRules['experience'] = 'sometimes|string|max:500';
                $validationRules['hourly_rate'] = 'sometimes|numeric|min:0|max:999999.99';
                $validationRules['specialties'] = 'sometimes|array';
                $validationRules['selected_pet_types'] = 'sometimes|array';
            }

            $validationRules['pet_breeds'] = 'sometimes|array'; // Both roles can have pet breeds

            $request->validate($validationRules);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $file = $request->file('profile_image');
                $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('profile_images', $filename, 'public');
                $profileImageUrl = '/storage/' . $path;
                
                // Delete old profile image if exists
                if ($user->profile_image) {
                    $oldPath = str_replace('/storage/', '', $user->profile_image);
                    Storage::disk('public')->delete($oldPath);
                }
                
                $user->profile_image = $profileImageUrl;
                
                Log::info('📸 Profile image uploaded for user ' . $user->id . ': ' . $filename);
            }

            // Update other profile fields based on user role
            $baseFields = ['name', 'first_name', 'last_name', 'phone', 'address', 'gender', 'age', 'bio'];
            $sitterFields = ['experience', 'hourly_rate', 'specialties', 'selected_pet_types'];
            $commonFields = ['pet_breeds'];

            $allowedFields = array_merge($baseFields, $commonFields);
            if ($user->role === 'pet_sitter') {
                $allowedFields = array_merge($allowedFields, $sitterFields);
            }

            $updateData = $request->only($allowedFields);

            foreach ($updateData as $key => $value) {
                if ($value !== null) {
                    $user->$key = $value;
                }
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $this->buildUserProfile($user)
            ]);

        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    private function buildUserProfile(User $user)
    {
        // Base profile fields for all users
        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone,
            'address' => $user->address,
            'gender' => $user->gender,
            'age' => $user->age,
            'bio' => $user->bio,
            'profile_image' => $user->profile_image,
            'email_verified' => $user->email_verified_at !== null,
            'phone_verified' => $user->phone_verified_at !== null,
        ];

        // Add role-specific fields
        if ($user->role === 'pet_sitter') {
            // Pet sitter specific fields
            $profile['experience'] = $user->experience;
            $profile['hourly_rate'] = $user->hourly_rate;
            $profile['specialties'] = $user->specialties;
            $profile['selected_pet_types'] = $user->selected_pet_types;
            $profile['pet_breeds'] = $user->pet_breeds;
        } else {
            // Pet owner specific fields (no sitter-specific fields)
            $profile['pet_breeds'] = $user->pet_breeds; // Pet owners can have pet breeds they own
        }

        return $profile;
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
            $profileImageUrl = '/storage/' . $path;
            
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
