<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Image;
use App\Models\User;

class ImageController extends Controller
{
    public function index()
    {
        $images = Image::with('user')->where('type', 'id')->get();
        return view('admin.images', compact('images'));
    }
}
