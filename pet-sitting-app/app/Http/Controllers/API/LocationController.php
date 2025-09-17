<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    /**
     * Update pet sitter location
     */
    public function updateLocation(Request $request)
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

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'is_online' => 'boolean',
        ]);

        $user = $request->user();
        
        if (!$user || $user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'Only pet sitters can share their location'
            ], 403);
        }

        // Generate address from coordinates if not provided
        $address = $request->address;
        if (!$address) {
            $address = $this->generateAddressFromCoordinates($request->latitude, $request->longitude);
        }

        $locationData = [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address' => $address,
            'specialties' => $user->specialties ?: ['General Pet Care'],
            'experience' => $user->experience ?: '1 year',
            'pet_types' => $user->selected_pet_types ?: ['dogs', 'cats'],
            'selected_breeds' => $user->pet_breeds ? $this->formatBreedNames($user->pet_breeds) : ['All breeds welcome'],
            'hourly_rate' => $user->hourly_rate ?: 25,
            'rating' => 4.5, // Default rating
            'reviews' => 0, // Default reviews
            'bio' => $user->bio ?: 'Professional pet sitter ready to help!',
            'is_online' => $request->boolean('is_online', true),
            'last_seen' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
            'profile_image' => $user->profile_image,
            'followers' => $user->followers ?? 0,
            'following' => $user->following ?? 0,
        ];

        // Store location data in cache with 5-minute expiration
        $cacheKey = "sitter_location_{$user->id}";
        Cache::put($cacheKey, $locationData, 300); // 5 minutes

        // Also store in a global sitters list (only if online)
        $sittersKey = 'active_sitters';
        $activeSitters = Cache::get($sittersKey, []);
        
        if ($locationData['is_online']) {
            // Only add to active sitters if online
            $activeSitters[$user->id] = $locationData;
        } else {
            // Remove from active sitters if offline
            unset($activeSitters[$user->id]);
        }
        
        Cache::put($sittersKey, $activeSitters, 300);

        Log::info('📍 Pet sitter location updated', [
            'user_id' => $user->id,
            'name' => $user->name,
            'location' => [
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'address' => $request->address
            ],
            'is_online' => $request->boolean('is_online', true)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'location' => $locationData
        ]);
    }

    /**
     * Get nearby pet sitters
     */
    public function getNearbySitters(Request $request)
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

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0.1|max:50',
        ]);

        $userLat = $request->latitude;
        $userLon = $request->longitude;
        $radiusKm = $request->input('radius_km', 2);

        // Get all active sitters from cache
        $sittersKey = 'active_sitters';
        $activeSitters = Cache::get($sittersKey, []);

        $nearbySitters = [];

        foreach ($activeSitters as $sitterData) {
            if (!$sitterData['is_online']) continue;

            $distance = $this->calculateDistance(
                $userLat,
                $userLon,
                $sitterData['latitude'],
                $sitterData['longitude']
            );

            if ($distance <= $radiusKm) {
                // Get latest user data from database to ensure we have the most up-to-date profile
                $user = User::find($sitterData['user_id']);
                
                if ($user) {
                    // Use latest data from database, fallback to cached data if not available
                    $nearbySitters[] = [
                        'id' => $sitterData['user_id'],
                        'userId' => $sitterData['user_id'],
                        'name' => $user->name ?: $sitterData['name'],
                        'email' => $user->email ?: $sitterData['email'],
                        'location' => [
                            'latitude' => $sitterData['latitude'],
                            'longitude' => $sitterData['longitude'],
                            'address' => $sitterData['address'],
                        ],
                        'specialties' => $user->specialties ?: $sitterData['specialties'],
                        'experience' => $user->experience ?: $sitterData['experience'],
                        'petTypes' => $user->selected_pet_types ?: $sitterData['pet_types'],
                        'selectedBreeds' => ($user->pet_breeds && count($user->pet_breeds) > 0) ? $this->formatBreedNames($user->pet_breeds) : $this->formatBreedNames($sitterData['selected_breeds']),
                        'hourlyRate' => $user->hourly_rate ?: $sitterData['hourly_rate'],
                        'rating' => $sitterData['rating'],
                        'reviews' => $sitterData['reviews'],
                        'bio' => $user->bio ?: $sitterData['bio'],
                        'isOnline' => $sitterData['is_online'],
                        'lastSeen' => $sitterData['last_seen'],
                        'distance' => round($distance, 1) . ' km',
                        'profile_image' => $user->profile_image,
                        'images' => $user->profile_image ? [$user->profile_image] : null,
                        'followers' => $user->followers ?? 0,
                        'following' => $user->following ?? 0
                    ];
                } else {
                    // Fallback to cached data if user not found in database
                $nearbySitters[] = [
                    'id' => $sitterData['user_id'],
                    'userId' => $sitterData['user_id'],
                    'name' => $sitterData['name'],
                    'email' => $sitterData['email'],
                    'location' => [
                        'latitude' => $sitterData['latitude'],
                        'longitude' => $sitterData['longitude'],
                        'address' => $sitterData['address'],
                    ],
                    'specialties' => $sitterData['specialties'],
                    'experience' => $sitterData['experience'],
                    'petTypes' => $sitterData['pet_types'],
                    'selectedBreeds' => ($sitterData['selected_breeds'] && count($sitterData['selected_breeds']) > 0) ? $this->formatBreedNames($sitterData['selected_breeds']) : ['All breeds welcome'],
                    'hourlyRate' => $sitterData['hourly_rate'],
                    'rating' => $sitterData['rating'],
                    'reviews' => $sitterData['reviews'],
                    'bio' => $sitterData['bio'],
                    'isOnline' => $sitterData['is_online'],
                    'lastSeen' => $sitterData['last_seen'],
                    'distance' => round($distance, 1) . ' km',
                        'profile_image' => null,
                        'images' => null,
                        'followers' => 0,
                        'following' => 0
                    ];
                }
            }
        }

        // Sort by distance
        usort($nearbySitters, function($a, $b) {
            $distA = floatval(str_replace(' km', '', $a['distance']));
            $distB = floatval(str_replace(' km', '', $b['distance']));
            return $distA <=> $distB;
        });

        Log::info('🔍 Nearby sitters requested', [
            'user_location' => ['latitude' => $userLat, 'longitude' => $userLon],
            'radius_km' => $radiusKm,
            'found_sitters' => count($nearbySitters)
        ]);

        return response()->json([
            'success' => true,
            'sitters' => $nearbySitters,
            'count' => count($nearbySitters),
            'radius_km' => $radiusKm
        ]);
    }

    /**
     * Set sitter online/offline status
     */
    public function setOnlineStatus(Request $request)
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

        $request->validate([
            'is_online' => 'required|boolean',
        ]);

        $user = $request->user();
        
        if (!$user || $user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'Only pet sitters can update their status'
            ], 403);
        }

        $isOnline = $request->boolean('is_online');

        // Update the sitter's online status in cache
        $cacheKey = "sitter_location_{$user->id}";
        $locationData = Cache::get($cacheKey);
        
        if ($locationData) {
            $locationData['is_online'] = $isOnline;
            $locationData['last_seen'] = now()->toISOString();
            $locationData['updated_at'] = now()->toISOString();
            
            // Ensure profile image is included
            if (!isset($locationData['profile_image'])) {
                $locationData['profile_image'] = $user->profile_image;
            }
            
            Cache::put($cacheKey, $locationData, 300);
            
            // Update in global sitters list
            $sittersKey = 'active_sitters';
            $activeSitters = Cache::get($sittersKey, []);
            
            if ($isOnline) {
                // If going online, add/update in active sitters list
                $activeSitters[$user->id] = $locationData;
            } else {
                // If going offline, remove from active sitters list entirely
                unset($activeSitters[$user->id]);
            }
            
            Cache::put($sittersKey, $activeSitters, 300);
        }

        Log::info('👤 Pet sitter status updated', [
            'user_id' => $user->id,
            'name' => $user->name,
            'is_online' => $isOnline
        ]);

        return response()->json([
            'success' => true,
            'message' => $isOnline ? 'Now online' : 'Now offline',
            'is_online' => $isOnline
        ]);
    }

    /**
     * Get sitter availability
     */
    public function getSitterAvailability(Request $request, $sitterId)
    {
        // Set CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        try {
            // Get real availability from cache (stored when sitter sets availability)
            $availabilityKey = "sitter_availability_{$sitterId}";
            $availabilityData = Cache::get($availabilityKey, []);
            
            // Convert to the expected format
            $availabilities = [];
            foreach ($availabilityData as $date => $timeRanges) {
                $availabilities[] = [
                    'date' => $date,
                    'timeRanges' => $timeRanges
                ];
            }

            // Sort by date
            usort($availabilities, function($a, $b) {
                return strcmp($a['date'], $b['date']);
            });

            Log::info('📅 Sitter availability requested', [
                'sitter_id' => $sitterId,
                'availability_count' => count($availabilities),
                'raw_data' => $availabilityData
            ]);

            return response()->json([
                'success' => true,
                'availabilities' => $availabilities,
                'sitter_id' => $sitterId
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error getting sitter availability', [
                'sitter_id' => $sitterId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get sitter availability',
                'availabilities' => []
            ], 500);
        }
    }

    /**
     * Save sitter availability
     */
    public function saveSitterAvailability(Request $request)
    {
        // Set CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $user = $request->user();
        
        if (!$user || $user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'Only pet sitters can save availability'
            ], 403);
        }

        $request->validate([
            'availabilities' => 'required|array',
            'availabilities.*.date' => 'required|date',
            'availabilities.*.timeRanges' => 'required|array',
            'availabilities.*.timeRanges.*.startTime' => 'required|string',
            'availabilities.*.timeRanges.*.endTime' => 'required|string',
        ]);

        try {
            $availabilities = $request->input('availabilities');
            
            // Convert array format to key-value format for storage
            $availabilityData = [];
            foreach ($availabilities as $availability) {
                $availabilityData[$availability['date']] = $availability['timeRanges'];
            }

            // Store in cache
            $availabilityKey = "sitter_availability_{$user->id}";
            Cache::put($availabilityKey, $availabilityData, 86400 * 30); // Store for 30 days

            Log::info('📅 Sitter availability saved', [
                'user_id' => $user->id,
                'name' => $user->name,
                'availability_count' => count($availabilityData)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Availability saved successfully',
                'availabilities' => $availabilities
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error saving sitter availability', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save availability'
            ], 500);
        }
    }

    /**
     * Generate address from coordinates
     */
    private function generateAddressFromCoordinates($latitude, $longitude)
    {
        try {
            // Use a simple reverse geocoding approach
            // For now, return coordinates as a readable format
            return number_format($latitude, 4) . ', ' . number_format($longitude, 4);
        } catch (\Exception $e) {
            Log::error('Failed to generate address from coordinates: ' . $e->getMessage());
            return number_format($latitude, 4) . ', ' . number_format($longitude, 4);
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $R = 6371; // Earth's radius in kilometers
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $distance = $R * $c; // Distance in kilometers
        return $distance;
    }

    /**
     * Convert breed IDs to readable names
     */
    private function formatBreedNames($breeds)
    {
        if (!$breeds || !is_array($breeds)) {
            return $breeds;
        }

        $breedMapping = [
            // Dog breeds
            'labrador' => 'Labrador Retriever',
            'golden' => 'Golden Retriever',
            'german-shepherd' => 'German Shepherd',
            'bulldog' => 'Bulldog',
            'beagle' => 'Beagle',
            'poodle' => 'Poodle',
            'rottweiler' => 'Rottweiler',
            'yorkshire' => 'Yorkshire Terrier',
            'boxer' => 'Boxer',
            'dachshund' => 'Dachshund',
            // Cat breeds
            'persian' => 'Persian',
            'siamese' => 'Siamese',
            'maine-coon' => 'Maine Coon',
            'ragdoll' => 'Ragdoll',
            'british-shorthair' => 'British Shorthair',
            'abyssinian' => 'Abyssinian',
            'russian-blue' => 'Russian Blue',
            'bengal' => 'Bengal',
            'sphynx' => 'Sphynx',
            'scottish-fold' => 'Scottish Fold',
        ];

        return array_map(function($breed) use ($breedMapping) {
            // If we have a mapping for this ID, use the readable name
            if (isset($breedMapping[$breed])) {
                return $breedMapping[$breed];
            }
            // Otherwise, return the original value (it might already be a readable name)
            return $breed;
        }, $breeds);
    }
}
