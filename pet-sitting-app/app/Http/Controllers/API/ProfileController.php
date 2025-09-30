<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        $user = Auth::user();
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_image' => $user->profile_image,
                'profile_image_url' => $user->profile_image ? (
                    str_starts_with($user->profile_image, 'http') 
                        ? $user->profile_image 
                        : asset('storage/' . $user->profile_image)
                ) : null,
                'phone' => $user->phone,
                'address' => $user->address,
                'age' => $user->age,
                'gender' => $user->gender,
                'bio' => $user->bio,
                'hourly_rate' => $user->hourly_rate,
                'experience' => $user->experience,
                'specialties' => $user->specialties,
                'selected_pet_types' => $user->selected_pet_types,
                'pet_breeds' => $user->pet_breeds,
                'email_verified' => $user->email_verified,
                'phone_verified' => $user->phone_verified,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request)
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:500',
            'age' => 'sometimes|integer|min:1|max:120',
            'gender' => 'sometimes|string|in:male,female,other',
            'bio' => 'sometimes|string|max:1000',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'experience' => 'sometimes|string|max:255',
            'specialties' => 'sometimes|array',
            'specialties.*' => 'string|max:255',
            'selected_pet_types' => 'sometimes|array',
            'selected_pet_types.*' => 'string|max:255',
            'pet_breeds' => 'sometimes|array',
            'pet_breeds.*' => 'string|max:255',
            'profile_image' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Update user profile
            if ($request->has('name')) {
                $nameParts = explode(' ', $request->name, 2);
                $user->first_name = $nameParts[0];
                $user->last_name = isset($nameParts[1]) ? $nameParts[1] : '';
            }
            
            if ($request->has('first_name')) {
                $user->first_name = $request->first_name;
            }
            
            if ($request->has('last_name')) {
                $user->last_name = $request->last_name;
            }
            
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            
            if ($request->has('phone')) {
                $user->phone = $request->phone;
            }
            
            if ($request->has('address')) {
                $user->address = $request->address;
            }
            
            if ($request->has('age')) {
                $user->age = $request->age;
            }
            
            if ($request->has('gender')) {
                $user->gender = $request->gender;
            }
            
            if ($request->has('bio')) {
                $user->bio = $request->bio;
            }
            
            if ($request->has('hourly_rate')) {
                $user->hourly_rate = $request->hourly_rate;
            }
            
            if ($request->has('experience')) {
                $user->experience = $request->experience;
            }
            
            if ($request->has('specialties')) {
                $user->specialties = $request->specialties;
            }
            
            if ($request->has('selected_pet_types')) {
                $user->selected_pet_types = $request->selected_pet_types;
            }
            
            if ($request->has('pet_breeds')) {
                $user->pet_breeds = $request->pet_breeds;
            }
            
            if ($request->has('profile_image')) {
                $profileImage = $request->profile_image;
                // Clean up profile image - remove full URL if present
                if (str_starts_with($profileImage, 'http')) {
                    // Extract storage path from full URL
                    $urlParts = explode('/storage/', $profileImage);
                    if (count($urlParts) > 1) {
                        $profileImage = $urlParts[1];
                    }
                }
                $user->profile_image = $profileImage;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'profile_image' => $user->profile_image,
                    'profile_image_url' => $user->profile_image ? (
                        str_starts_with($user->profile_image, 'http') 
                            ? $user->profile_image 
                            : asset('storage/' . $user->profile_image)
                    ) : null,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'age' => $user->age,
                    'gender' => $user->gender,
                    'bio' => $user->bio,
                    'hourly_rate' => $user->hourly_rate,
                    'experience' => $user->experience,
                    'specialties' => $user->specialties,
                    'selected_pet_types' => $user->selected_pet_types,
                    'pet_breeds' => $user->pet_breeds,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload profile image
     */
    public function uploadImage(Request $request)
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Delete old profile image if exists
            if ($user->profile_image && Storage::disk('public')->exists($user->profile_image)) {
                Storage::disk('public')->delete($user->profile_image);
            }

            // Store new image
            $imagePath = $request->file('image')->store('profile_images', 'public');
            
            // Update user profile image
            $user->profile_image = $imagePath;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'profile_image' => $imagePath,
                'full_url' => asset('storage/' . $imagePath)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}