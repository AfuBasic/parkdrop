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
        Schema::create('sync_mutation_receipts', function (Blueprint $table) {
            $table->id();
            $table->uuid('mutation_id')->unique();
            $table->uuid('device_uuid');
            $table->unsignedBigInteger('device_sequence')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('operation');
            $table->string('payload_hash')->nullable();
            $table->string('result_status');
            $table->json('result_metadata')->nullable();
            $table->timestamp('processed_at')->useCurrent();
            $table->timestamps();

            $table->foreign('device_uuid')->references('uuid')->on('devices')->cascadeOnDelete();
            $table->unique(['device_uuid', 'device_sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_mutation_receipts');
    }
};
