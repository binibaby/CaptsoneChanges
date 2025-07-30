@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Verification Details</h1>
            <p class="mt-2 text-sm text-gray-700">Review verification request details.</p>
        </div>
    </div>

    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">Verification Information</h3>
            <p class="mt-1 text-sm text-gray-600">Detailed verification information will be displayed here.</p>

            @if($verification->status === 'approved')
                <div class="mt-6">
                    <h4 class="text-md font-semibold mb-2">Uploaded Images</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        @foreach($verification->user->images ?? [] as $image)
                            <div class="border rounded p-2 bg-gray-50">
                                <img src="{{ asset('storage/' . $image->file_path) }}" alt="Verification Image" class="w-full h-auto rounded" />
                                <div class="text-xs text-gray-500 mt-1">Uploaded: {{ $image->created_at }}</div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection 