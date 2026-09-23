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
        Schema::dropIfExists('payments');

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('package_id')->constrained('packages')->cascadeOnDelete();
            $table->integer('amount_minor');
            $table->string('method', 20); // CASH, TRANSFER, POS, OTHER
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('recorded_by_device_uuid')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamp('client_recorded_at')->nullable();
            $table->string('status', 20)->default('COMPLETED'); // COMPLETED, REVERSED
            $table->foreignUuid('reverses_payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('reversal_reason')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            // Operational & tenant query indexes
            $table->index(['business_id', 'package_id', 'recorded_at']);
            $table->index(['package_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
