<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PetController extends Controller
{
    /**
     * Get all pets for the authenticated user
     */
    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // For now, return mock data since we don't have a pets table yet
            // In a real implementation, you would query the pets table
            $pets = [
                [
                    'id' => 1,
                    'name' => 'Buddy',
                    'age' => '3 years',
                    'breed' => 'Golden Retriever',
                    'type' => 'Dog',
                    'image' => null,
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString(),
                ],
                [
                    'id' => 2,
                    'name' => 'Whiskers',
                    'age' => '2 years',
                    'breed' => 'Persian',
                    'type' => 'Cat',
                    'image' => null,
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString(),
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Pets retrieved successfully',
                'pets' => $pets,
                'count' => count($pets)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new pet
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'age' => 'required|string|max:100',
                'breed' => 'required|string|max:255',
                'type' => 'required|string|in:Dog,Cat,Bird,Fish,Other',
                'image' => 'nullable|string',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $data = $request->all();
            $data['user_id'] = $user->id;

            // Generate a unique ID for the pet
            $petId = Str::uuid()->toString();

            // Handle image upload if provided
            if ($request->has('image') && $request->image) {
                $imagePath = $this->handleImageUpload($request->image, $petId);
                $data['image'] = $imagePath;
            }

            // For now, just return the created pet data
            // In a real implementation, you would save to the pets table
            $pet = [
                'id' => $petId,
                'name' => $data['name'],
                'age' => $data['age'],
                'breed' => $data['breed'],
                'type' => $data['type'],
                'image' => $data['image'] ?? null,
                'notes' => $data['notes'] ?? null,
                'user_id' => $user->id,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Pet created successfully',
                'pet' => $pet
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create pet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific pet
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // For now, return mock data
            // In a real implementation, you would query the pets table
            $pet = [
                'id' => $id,
                'name' => 'Buddy',
                'age' => '3 years',
                'breed' => 'Golden Retriever',
                'type' => 'Dog',
                'image' => null,
                'notes' => 'Loves to play fetch',
                'user_id' => $user->id,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Pet retrieved successfully',
                'pet' => $pet
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a pet
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'age' => 'sometimes|required|string|max:100',
                'breed' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|in:Dog,Cat,Bird,Fish,Other',
                'image' => 'nullable|string',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $data = $request->all();

            // Handle image upload if provided
            if ($request->has('image') && $request->image) {
                $imagePath = $this->handleImageUpload($request->image, $id);
                $data['image'] = $imagePath;
            }

            // For now, just return the updated pet data
            // In a real implementation, you would update the pets table
            $pet = [
                'id' => $id,
                'name' => $data['name'] ?? 'Buddy',
                'age' => $data['age'] ?? '3 years',
                'breed' => $data['breed'] ?? 'Golden Retriever',
                'type' => $data['type'] ?? 'Dog',
                'image' => $data['image'] ?? null,
                'notes' => $data['notes'] ?? 'Loves to play fetch',
                'user_id' => $user->id,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Pet updated successfully',
                'pet' => $pet
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update pet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a pet
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // For now, just return success
            // In a real implementation, you would delete from the pets table

            return response()->json([
                'success' => true,
                'message' => 'Pet deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete pet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle image upload
     */
    private function handleImageUpload(string $imageData, string $petId): string
    {
        try {
            // Check if it's a base64 image
            if (strpos($imageData, 'data:image') === 0) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
            }

            $imageData = base64_decode($imageData);
            $imageName = 'pet_' . $petId . '_' . time() . '.jpg';
            $imagePath = 'pet_images/' . $imageName;

            Storage::disk('public')->put($imagePath, $imageData);

            return '/storage/' . $imagePath;
        } catch (\Exception $e) {
            throw new \Exception('Failed to upload image: ' . $e->getMessage());
        }
    }
}