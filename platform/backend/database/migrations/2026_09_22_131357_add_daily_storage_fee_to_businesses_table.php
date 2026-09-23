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
        Schema::table('businesses', function (Blueprint $table) {
            // In kobo. Added to the package's initial fee for every full
            // calendar day beyond the first that it sits uncollected. 50000
            // kobo (NGN 500) matches the default shown in onboarding.
            $table->unsignedInteger('daily_storage_fee_minor')->default(50000);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('daily_storage_fee_minor');
        });
    }
};
