<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Events\ProfileChangeRequested;
use App\Events\ProfileChangeApproved;
use App\Events\ProfileChangeRejected;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProfileChangeRequestController extends Controller
{
    /**
     * Submit a profile change request
     */
    public function submitRequest(Request $request): JsonResponse
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $validator = Validator::make($request->all(), [
            'field_name' => ['required', Rule::in(['name', 'address', 'phone'])],
            'new_value' => 'required|string|max:255',
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        // Get current value for the field
        $oldValue = $this->getCurrentFieldValue($user, $request->field_name);

        // Check if there's already a pending request for this field
        $existingRequest = ProfileChangeRequest::where('user_id', $user->id)
            ->where('field_name', $request->field_name)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending request for this field. Please wait for it to be reviewed.'
            ], 409);
        }

        // Check if the new value is different from current value
        if ($oldValue === $request->new_value) {
            return response()->json([
                'success' => false,
                'message' => 'The new value must be different from your current value.'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $requestData = ProfileChangeRequest::create([
                'user_id' => $user->id,
                'field_name' => $request->field_name,
                'old_value' => $oldValue,
                'new_value' => $request->new_value,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            // Broadcast the event
            event(new ProfileChangeRequested($requestData));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profile change request submitted successfully',
                'request' => $requestData
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all profile change requests (admin only)
     */
    public function getAllRequests(Request $request): JsonResponse
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $status = $request->query('status');
        $perPage = $request->query('per_page', 15);

        $query = ProfileChangeRequest::with(['user:id,name,email', 'reviewer:id,name'])
            ->orderBy('created_at', 'desc');

        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        $requests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'requests' => $requests->items(),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ]
        ]);
    }

    /**
     * Approve a profile change request
     */
    public function approveRequest(Request $request, $id): JsonResponse
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $changeRequest = ProfileChangeRequest::find($id);
        if (!$changeRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        if (!$changeRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been processed'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update the user's profile
            $this->updateUserProfile($changeRequest);

            // Update the request status
            $changeRequest->update([
                'status' => 'approved',
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Broadcast the event
            event(new ProfileChangeApproved($changeRequest));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profile change request approved successfully',
                'request' => $changeRequest->load(['user:id,name,email', 'reviewer:id,name'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a profile change request
     */
    public function rejectRequest(Request $request, $id): JsonResponse
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $changeRequest = ProfileChangeRequest::find($id);
        if (!$changeRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        if (!$changeRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been processed'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update the request status
            $changeRequest->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Broadcast the event
            event(new ProfileChangeRejected($changeRequest));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profile change request rejected successfully',
                'request' => $changeRequest->load(['user:id,name,email', 'reviewer:id,name'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current field value from user
     */
    private function getCurrentFieldValue(User $user, string $fieldName): ?string
    {
        return match($fieldName) {
            'name' => $user->name,
            'address' => $user->address,
            'phone' => $user->phone,
            default => null
        };
    }

    /**
     * Update user profile based on approved request
     */
    private function updateUserProfile(ProfileChangeRequest $request): void
    {
        $user = $request->user;
        
        match($request->field_name) {
            'name' => $user->update(['name' => $request->new_value]),
            'address' => $user->update(['address' => $request->new_value]),
            'phone' => $user->update(['phone' => $request->new_value]),
        };
    }
}