<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('is_weekly')->default(false)->after('status');
            $table->date('start_date')->nullable()->after('is_weekly');
            $table->date('end_date')->nullable()->after('start_date');
            $table->time('start_time')->nullable()->after('end_date');
            $table->time('end_time')->nullable()->after('start_time');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('end_time');
            $table->decimal('total_amount', 10, 2)->nullable()->after('hourly_rate');
            $table->string('pet_name')->nullable()->after('total_amount');
            $table->string('pet_type')->nullable()->after('pet_name');
            $table->string('service_type')->nullable()->after('pet_type');
            $table->integer('duration')->nullable()->after('service_type');
            $table->text('description')->nullable()->after('duration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'is_weekly',
                'start_date',
                'end_date',
                'start_time',
                'end_time',
                'hourly_rate',
                'total_amount',
                'pet_name',
                'pet_type',
                'service_type',
                'duration',
                'description'
            ]);
        });
    }
};
