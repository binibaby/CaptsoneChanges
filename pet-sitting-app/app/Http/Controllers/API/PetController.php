<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PetController extends Controller
{
    public function index()
    {
        try {
            // Add debugging
            \Log::info('🔔 PET LIST REQUEST RECEIVED');
            \Log::info('🔑 Authorization header: ' . request()->header('Authorization'));

            $user = Auth::user();
            
            if (!$user) {
                \Log::error('❌ No authenticated user found for pet list');
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            \Log::info('✅ Authenticated user for pet list: ' . $user->id . ' (' . $user->email . ')');
            
            $pets = Pet::where('user_id', $user->id)->get();

            return response()->json([
                'success' => true,
                'pets' => $pets,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pets: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pets',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Add debugging
            \Log::info('🔔 PET CREATION REQUEST RECEIVED');
            \Log::info('📝 Request data:', $request->all());
            \Log::info('🌐 Request IP: ' . $request->ip());
            \Log::info('👤 User Agent: ' . $request->userAgent());
            \Log::info('🔑 Authorization header: ' . $request->header('Authorization'));

            $user = Auth::user();
            
            if (!$user) {
                \Log::error('❌ No authenticated user found');
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            \Log::info('✅ Authenticated user: ' . $user->id . ' (' . $user->email . ')');

            $request->validate([
                'name' => 'required|string|max:255',
                'age' => 'required|string|max:50',
                'breed' => 'required|string|max:255',
                'type' => 'required|in:Dog,Cat,Bird,Fish,Other',
                'image' => 'nullable|string',
                'notes' => 'nullable|string|max:1000',
            ]);

            $petData = [
                'user_id' => $user->id,
                'name' => $request->name,
                'age' => $request->age,
                'breed' => $request->breed,
                'type' => $request->type,
                'notes' => $request->notes,
            ];

            // Handle image upload if provided
            if ($request->has('image') && $request->image) {
                // For now, store the image URL as provided by the frontend
                // In a real app, you might want to upload the image to storage
                $petData['image'] = $request->image;
            }

            $pet = Pet::create($petData);

            Log::info('Pet created successfully for user ' . $user->id . ': ' . $pet->name);

            return response()->json([
                'success' => true,
                'message' => 'Pet added successfully',
                'pet' => $pet,
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating pet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add pet: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = Auth::user();
            $pet = Pet::where('user_id', $user->id)->findOrFail($id);

            return response()->json([
                'success' => true,
                'pet' => $pet,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Pet not found',
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $pet = Pet::where('user_id', $user->id)->findOrFail($id);

            $request->validate([
                'name' => 'sometimes|string|max:255',
                'age' => 'sometimes|string|max:50',
                'breed' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:Dog,Cat,Bird,Fish,Other',
                'image' => 'nullable|string',
                'notes' => 'nullable|string|max:1000',
            ]);

            $pet->update($request->only(['name', 'age', 'breed', 'type', 'image', 'notes']));

            Log::info('Pet updated successfully: ' . $pet->name);

            return response()->json([
                'success' => true,
                'message' => 'Pet updated successfully',
                'pet' => $pet,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating pet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update pet: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $pet = Pet::where('user_id', $user->id)->findOrFail($id);

            // Delete pet image if exists
            if ($pet->image) {
                // In a real app, you might want to delete the actual image file
                // Storage::disk('public')->delete($pet->image);
            }

            $pet->delete();

            Log::info('Pet deleted successfully: ' . $pet->name);

            return response()->json([
                'success' => true,
                'message' => 'Pet deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting pet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete pet: ' . $e->getMessage(),
            ], 500);
        }
    }
}
