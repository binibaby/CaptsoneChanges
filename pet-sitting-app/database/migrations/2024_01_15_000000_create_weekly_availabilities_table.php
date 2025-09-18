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
        Schema::create('weekly_availabilities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sitter_id');
            $table->string('week_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_weekly')->default(true);
            $table->timestamps();
            
            $table->foreign('sitter_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['sitter_id', 'start_date']);
            $table->unique(['sitter_id', 'week_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_availabilities');
    }
};
