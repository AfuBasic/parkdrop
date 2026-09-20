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
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pickup_point_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            
            // Public package ID is typically unique per business
            $table->string('public_package_id', 50);
            
            // Pickup code is unique per business
            $table->string('pickup_code', 50);
            
            // Amount due in minor units
            $table->integer('amount_due_minor')->default(0);
            
            // Canonical statuses: WAITING, COLLECTED, RETURNED, CANCELLED
            $table->string('status', 20)->default('WAITING');
            
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('created_by_device_uuid')->nullable();
            
            $table->timestamp('client_created_at')->nullable();
            $table->integer('version')->default(1);
            
            $table->timestamps();

            // Unique constraints
            $table->unique(['business_id', 'public_package_id']);
            $table->unique(['business_id', 'pickup_code']);

            // Useful query indexes
            $table->index(['business_id', 'status']);
            $table->index(['business_id', 'pickup_point_id', 'status'], 'idx_bus_pickup_stat');
            $table->index(['customer_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
