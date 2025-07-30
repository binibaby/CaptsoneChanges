@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <h1>Manage ID Images</h1>
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>Image</th>
                <th>Uploaded At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($images as $image)
            <tr>
                <td>{{ $image->id }}</td>
                <td>{{ $image->user->name ?? '-' }}</td>
                <td>
                    <img src="{{ asset('storage/' . $image->file_path) }}" width="100"/>
                </td>
                <td>{{ $image->created_at }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 