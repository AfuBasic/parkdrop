<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sms_credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sms_wallet_id')->constrained()->cascadeOnDelete();
            $table->integer('amount');
            $table->enum('type', ['credit', 'debit']);
            $table->string('reference_type'); // e.g., 'WELCOME_CREDIT', 'PACKAGE_SMS'
            $table->string('reference_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_credit_transactions');
    }
};
