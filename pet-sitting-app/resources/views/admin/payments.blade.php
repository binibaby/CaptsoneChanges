@extends('layouts.app')

@section('content')
<div class="container mt-5">
    <h1>Manage Payments</h1>
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>ID</th>
                <th>Booking ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>App Share</th>
                <th>Sitter Share</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $payment)
            <tr>
                <td>{{ $payment->id }}</td>
                <td>{{ $payment->booking_id }}</td>
                <td>₱{{ number_format($payment->amount, 2) }}</td>
                <td>{{ $payment->method }}</td>
                <td>₱{{ number_format($payment->app_share, 2) }}</td>
                <td>₱{{ number_format($payment->sitter_share, 2) }}</td>
                <td>{{ $payment->status }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection 