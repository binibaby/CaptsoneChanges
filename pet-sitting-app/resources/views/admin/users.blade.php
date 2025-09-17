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
                <th>Phone</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Pet Types</th>
                <th>Pet Breeds</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->id }}</td>
                <td>
                    @if($user->first_name && $user->last_name)
                        {{ $user->first_name }} {{ $user->last_name }}
                    @else
                        {{ $user->name }}
                    @endif
                </td>
                <td>{{ $user->email }}</td>
                <td>{{ $user->phone ?? 'N/A' }}</td>
                <td>{{ $user->age ?? 'N/A' }}</td>
                <td>{{ $user->gender ? ucfirst($user->gender) : 'N/A' }}</td>
                <td>
                    @if($user->selected_pet_types && is_array($user->selected_pet_types))
                        {{ implode(', ', $user->selected_pet_types) }}
                    @else
                        N/A
                    @endif
                </td>
                <td>
                    @if($user->pet_breeds && is_array($user->pet_breeds))
                        {{ implode(', ', $user->pet_breeds) }}
                    @else
                        N/A
                    @endif
                </td>
                <td>{{ ucfirst(str_replace('_', ' ', $user->role)) }}</td>
                <td>
                    <span class="badge badge-{{ $user->status === 'active' ? 'success' : ($user->status === 'pending' ? 'warning' : 'danger') }}">
                        {{ ucfirst($user->status) }}
                    </span>
                </td>
                <td>
                    <a href="{{ route('admin.users.show', $user->id) }}" class="btn btn-sm btn-primary">View</a>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 