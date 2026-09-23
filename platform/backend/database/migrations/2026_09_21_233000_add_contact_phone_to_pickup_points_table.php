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
        Schema::table('pickup_points', function (Blueprint $table) {
            $table->string('contact_phone', 30)->nullable()->after('park_name');
            $table->timestamp('contact_phone_confirmed_at')->nullable()->after('contact_phone');
            $table->string('contact_phone_source', 30)->nullable()->after('contact_phone_confirmed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pickup_points', function (Blueprint $table) {
            $table->dropColumn(['contact_phone', 'contact_phone_confirmed_at', 'contact_phone_source']);
        });
    }
};
