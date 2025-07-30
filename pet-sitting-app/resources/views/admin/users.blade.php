@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <h1>Manage Users</h1>
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>ID Status</th>
                <th>ID Image</th>
                <th>Role</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->id }}</td>
                <td>{{ $user->name }}</td>
                <td>{{ $user->email }}</td>
                <td>{{ $user->id_status }}</td>
                <td>
                    @if($user->id_image)
                        <img src="{{ asset('storage/' . $user->id_image) }}" width="80"/>
                    @else
                        N/A
                    @endif
                </td>
                <td>{{ $user->is_admin ? 'Admin' : 'User' }}</td>
                <td>
                    <!-- Approve/Deny actions can be added here -->
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 