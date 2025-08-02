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
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('last_name');
            $table->integer('age')->nullable()->after('gender');
            $table->json('pet_breeds')->nullable()->after('age'); // Store preferred pet breeds
            $table->text('bio')->nullable()->after('pet_breeds');
            $table->string('profile_image')->nullable()->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name', 
                'gender',
                'age',
                'pet_breeds',
                'bio',
                'profile_image'
            ]);
        });
    }
};
