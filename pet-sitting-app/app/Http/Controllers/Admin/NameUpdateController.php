<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\NameUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class NameUpdateController extends Controller
{
    /**
     * Display the name update management page
     */
    public function index()
    {
        return view('admin.name-updates.index');
    }

    /**
     * Get all users for admin name update management (only users with name update requests)
     */
    public function getUsers(Request $request)
    {
        try {
            // Only get users who have submitted name update requests
            $query = User::select('id', 'name', 'first_name', 'last_name', 'email', 'phone', 'role', 'created_at', 'profile_image')
                ->whereHas('nameUpdateRequests'); // Only users with name update requests

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('phone', 'LIKE', "%{$search}%")
                      ->orWhere('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%");
                });
            }

            // Apply role filter
            if ($request->has('role') && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'users' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user name by admin
     */
    public function updateUserName(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'new_first_name' => 'required|string|max:255',
            'new_last_name' => 'required|string|max:255',
            'reason' => 'required|string|max:1000',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = User::findOrFail($request->user_id);
            $oldName = $user->name;
            $oldFirstName = $user->first_name;
            $oldLastName = $user->last_name;

            $newFirstName = trim($request->new_first_name);
            $newLastName = trim($request->new_last_name);
            $newName = $newFirstName . ' ' . $newLastName;

            // Check if name actually changed
            if ($newName === $oldName) {
                return response()->json([
                    'success' => false,
                    'message' => 'The new name is the same as the current name.'
                ], 400);
            }

            // Update user name
            $user->first_name = $newFirstName;
            $user->last_name = $newLastName;
            $user->name = $newName;
            $user->save();

            // Create name update request record for audit trail
            NameUpdateRequest::create([
                'user_id' => $user->id,
                'old_name' => $oldName,
                'new_name' => $newName,
                'old_first_name' => $oldFirstName,
                'new_first_name' => $newFirstName,
                'old_last_name' => $oldLastName,
                'new_last_name' => $newLastName,
                'reason' => $request->reason,
                'status' => 'approved',
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User name updated successfully',
                'user' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user name: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all name update requests
     */
    public function getNameUpdateRequests(Request $request)
    {
        try {
            $query = NameUpdateRequest::with(['user:id,name,email,phone', 'reviewer:id,name'])
                ->orderBy('created_at', 'desc');

            // Apply status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $requests = $query->get();

            return response()->json([
                'success' => true,
                'requests' => $requests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch name update requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a name update request
     */
    public function approveRequest(Request $request, $id)
    {
        try {
            $nameUpdateRequest = NameUpdateRequest::findOrFail($id);

            if ($nameUpdateRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed.'
                ], 400);
            }

            DB::beginTransaction();

            // Update user name
            $user = User::findOrFail($nameUpdateRequest->user_id);
            $user->first_name = $nameUpdateRequest->new_first_name;
            $user->last_name = $nameUpdateRequest->new_last_name;
            $user->name = $nameUpdateRequest->new_name;
            $user->save();

            // Update request status
            $nameUpdateRequest->status = 'approved';
            $nameUpdateRequest->admin_notes = $request->admin_notes;
            $nameUpdateRequest->reviewed_by = Auth::id();
            $nameUpdateRequest->reviewed_at = now();
            $nameUpdateRequest->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Name update request approved successfully'
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
     * Reject a name update request
     */
    public function rejectRequest(Request $request, $id)
    {
        try {
            $nameUpdateRequest = NameUpdateRequest::findOrFail($id);

            if ($nameUpdateRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed.'
                ], 400);
            }

            $nameUpdateRequest->status = 'rejected';
            $nameUpdateRequest->admin_notes = $request->admin_notes;
            $nameUpdateRequest->reviewed_by = Auth::id();
            $nameUpdateRequest->reviewed_at = now();
            $nameUpdateRequest->save();

            return response()->json([
                'success' => true,
                'message' => 'Name update request rejected successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject request: ' . $e->getMessage()
            ], 500);
        }
    }
}
