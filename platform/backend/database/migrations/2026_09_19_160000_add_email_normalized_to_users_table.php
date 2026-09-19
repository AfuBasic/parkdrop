<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_normalized')->nullable()->after('email')->index();
            $table->timestamp('email_verified_at')->nullable()->after('email_normalized');
        });

        // Backfill existing users if any
        DB::statement('UPDATE users SET email_normalized = LOWER(TRIM(email)) WHERE email_normalized IS NULL');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email_normalized');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email_normalized']);
            $table->dropColumn(['email_normalized', 'email_verified_at']);
        });
    }
};
