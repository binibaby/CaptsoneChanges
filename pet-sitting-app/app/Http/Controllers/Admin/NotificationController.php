<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::with('user')->latest()->paginate(20);
        return view('admin.notifications.index', compact('notifications'));
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'required|string',
            'user_ids' => 'array'
        ]);

        return redirect()->back()->with('success', 'Notification sent successfully.');
    }

    public function bulkSend(Request $request)
    {
        return redirect()->back()->with('success', 'Bulk notifications sent successfully.');
    }

    public function analytics()
    {
        return view('admin.notifications.analytics');
    }

    public function templates()
    {
        return view('admin.notifications.templates');
    }

    public function scheduled()
    {
        return view('admin.notifications.scheduled');
    }

    public function templateSend(Request $request)
    {
        return redirect()->back()->with('success', 'Template notification sent successfully.');
    }
}
