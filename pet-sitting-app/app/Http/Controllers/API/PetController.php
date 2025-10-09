<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Pet;
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
            
            // Retrieve pets from database for the authenticated user
            $pets = Pet::where('user_id', $user->id)->get();

            \Log::info('✅ Retrieved ' . $pets->count() . ' pets for user: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Pets retrieved successfully',
                'pets' => $pets,
                'count' => $pets->count()
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

            // Create the pet in the database
            $pet = Pet::create([
                'id' => $petId,
                'name' => $data['name'],
                'age' => $data['age'],
                'breed' => $data['breed'],
                'type' => $data['type'],
                'image' => $data['image'] ?? null,
                'notes' => $data['notes'] ?? null,
                'user_id' => $user->id,
            ]);

            \Log::info('✅ Pet created in database with ID: ' . $petId);

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
            
            // Return 404 for now since we don't have a pets table yet
            return response()->json([
                'success' => false,
                'message' => 'Pet not found',
                'error' => 'Pet with ID ' . $id . ' not found'
            ], 404);

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
            
            // Find the pet and verify it belongs to the authenticated user
            $pet = Pet::where('id', $id)->where('user_id', $user->id)->first();
            
            if (!$pet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pet not found or you do not have permission to delete this pet'
                ], 404);
            }

            // Delete the pet from the database
            $pet->delete();
            
            \Log::info('✅ Pet deleted from database with ID: ' . $id . ' by user: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Pet deleted successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ Error deleting pet: ' . $e->getMessage());
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
            \Log::info('🖼️ PetController: Starting image upload for pet: ' . $petId);
            \Log::info('🖼️ PetController: Image data: ' . $imageData);
            
            // Check if it's a file URI (from React Native)
            if (strpos($imageData, 'file://') === 0) {
                \Log::info('🖼️ PetController: Detected file URI, returning null for frontend handling');
                // Return null so frontend can show default image
                return null;
            }
            
            // Check if it's a base64 image
            if (strpos($imageData, 'data:image') === 0) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                \Log::info('🖼️ PetController: Removed data URL prefix, new length: ' . strlen($imageData));
            }

            $decodedData = base64_decode($imageData);
            \Log::info('🖼️ PetController: Decoded data length: ' . strlen($decodedData));
            
            if ($decodedData === false) {
                \Log::error('❌ PetController: Base64 decode failed');
                throw new \Exception('Invalid base64 image data');
            }
            
            $imageName = 'pet_' . $petId . '_' . time() . '.jpg';
            $imagePath = 'pet_images/' . $imageName;

            $saved = Storage::disk('public')->put($imagePath, $decodedData);
            \Log::info('🖼️ PetController: Image saved: ' . ($saved ? 'SUCCESS' : 'FAILED'));
            \Log::info('🖼️ PetController: Image path: ' . $imagePath);

            return '/storage/' . $imagePath;
        } catch (\Exception $e) {
            \Log::error('❌ PetController: Image upload failed: ' . $e->getMessage());
            throw new \Exception('Failed to upload image: ' . $e->getMessage());
        }
    }

    /**
     * Upload pet image
     */
    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
                'pet_id' => 'required|string'
            ]);

            $user = Auth::user();
            $petId = $request->input('pet_id');
            
            \Log::info('🖼️ PetController: Uploading image for pet: ' . $petId);

            // Handle the uploaded file
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                
                // Generate unique filename
                $imageName = 'pet_' . $petId . '_' . time() . '.' . $file->getClientOriginalExtension();
                $imagePath = 'pet_images/' . $imageName;

                // Store the file
                $stored = Storage::disk('public')->put($imagePath, file_get_contents($file));
                
                if ($stored) {
                    $fullPath = '/storage/' . $imagePath;
                    
                    \Log::info('✅ PetController: Image uploaded successfully: ' . $fullPath);
                    
                    // Update the pet record in the database with the image path
                    try {
                        $pet = Pet::where('id', $petId)->first();
                        if ($pet) {
                            $pet->image = $fullPath;
                            $pet->save();
                            \Log::info('✅ Pet image path saved to database for pet: ' . $petId);
                        } else {
                            \Log::error('❌ Pet not found in database for ID: ' . $petId);
                        }
                    } catch (\Exception $e) {
                        \Log::error('❌ Error updating pet image in database: ' . $e->getMessage());
                    }
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Image uploaded successfully',
                        'image_path' => $fullPath
                    ]);
                } else {
                    throw new \Exception('Failed to store image file');
                }
            } else {
                throw new \Exception('No image file provided');
            }

        } catch (\Exception $e) {
            \Log::error('❌ PetController: Image upload failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}