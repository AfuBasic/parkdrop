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
        Schema::create('sms_credit_purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('initiated_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('bundle_key');
            $table->unsignedInteger('credits');
            $table->unsignedInteger('amount_minor'); // Amount in kobo (NGN minor units)
            $table->string('currency', 3)->default('NGN');
            $table->string('status')->default('PENDING'); // PENDING, PROCESSING, PAID, FAILED, CANCELLED
            $table->string('reference')->unique(); // ParkDrop unique reference (e.g. PDR-XXXXXX)
            $table->string('provider')->default('paystack');
            $table->string('provider_reference')->nullable();
            $table->string('provider_transaction_id')->nullable();
            $table->string('provider_status')->nullable();
            $table->text('checkout_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->unique(['provider', 'provider_transaction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_credit_purchases');
    }
};
