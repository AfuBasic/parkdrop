<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alter the enum to add 'auth'
        DB::statement("ALTER TABLE auth_challenges MODIFY COLUMN purpose ENUM('auth', 'login', 'registration', 'pin_reset', 'new_device') NOT NULL DEFAULT 'auth'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE auth_challenges MODIFY COLUMN purpose ENUM('login', 'registration', 'pin_reset', 'new_device') NOT NULL DEFAULT 'login'");
    }
};
