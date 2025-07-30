<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Payment;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalUsers = User::count();
        $totalDenied = User::where('id_status', 'denied')->count();
        $totalIncome = Payment::sum('app_share');
        return view('admin.dashboard', compact('totalUsers', 'totalDenied', 'totalIncome'));
    }

    public function users()
    {
        $users = \App\Models\User::all();
        return view('admin.users', compact('users'));
    }
}
