@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <h1>Manage Bookings</h1>
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>Sitter</th>
                <th>Date</th>
                <th>Time</th>
                <th>Payment</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bookings as $booking)
            <tr>
                <td>{{ $booking->id }}</td>
                <td>{{ $booking->user->name ?? '-' }}</td>
                <td>{{ $booking->sitter->name ?? '-' }}</td>
                <td>{{ $booking->date }}</td>
                <td>{{ $booking->time }}</td>
                <td>
                    @if($booking->payment)
                        ₱{{ number_format($booking->payment->amount, 2) }} ({{ $booking->payment->method }})
                    @else
                        N/A
                    @endif
                </td>
                <td>{{ $booking->status }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 