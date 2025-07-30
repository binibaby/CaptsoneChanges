@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <h1>Admin Notifications</h1>
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Type</th>
                <th>Message</th>
                <th>Read At</th>
                <th>Created At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($notifications as $notification)
            <tr>
                <td>{{ $notification->id }}</td>
                <td>{{ $notification->user_id }}</td>
                <td>{{ $notification->type }}</td>
                <td>{{ $notification->message }}</td>
                <td>{{ $notification->read_at ?? 'Unread' }}</td>
                <td>{{ $notification->created_at }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 