<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * The payment provider's transaction fee, charged on top of the credits'
     * flat-rate cost since credits carry no margin. Stored explicitly rather
     * than derived from amount_minor minus credits × the current price —
     * the per-credit price can change later, and a purchase's fee must stay
     * whatever it actually was at the time it was charged.
     */
    public function up(): void
    {
        Schema::table('sms_credit_purchases', function (Blueprint $table) {
            $table->unsignedInteger('fee_minor')->default(0)->after('amount_minor');
        });
    }

    public function down(): void
    {
        Schema::table('sms_credit_purchases', function (Blueprint $table) {
            $table->dropColumn('fee_minor');
        });
    }
};
