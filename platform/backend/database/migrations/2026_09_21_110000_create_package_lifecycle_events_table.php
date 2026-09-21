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
        Schema::create('package_lifecycle_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('package_id')->unique()->constrained('packages')->cascadeOnDelete();
            $table->string('type', 20); // RETURN, CANCEL
            $table->string('reason', 50);
            $table->string('reason_note', 300)->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('device_uuid')->nullable();
            $table->timestamp('client_event_at')->nullable();
            $table->timestamp('server_received_at')->useCurrent();
            $table->timestamps();

            // Additional query indexes
            $table->index(['business_id', 'type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_lifecycle_events');
    }
};
