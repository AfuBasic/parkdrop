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
        Schema::create('package_media_upload_intents', function (Blueprint $table) {
            $table->id();
            $table->uuid('package_id');
            $table->foreign('package_id')->references('id')->on('packages')->cascadeOnDelete();
            $table->uuid('media_id');
            $table->string('expected_public_id')->unique();
            $table->string('status')->default('PENDING'); // PENDING, COMPLETED, EXPIRED
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_media_upload_intents');
    }
};
