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
        Schema::create('package_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->uuid('package_id');
            $table->foreign('package_id')->references('id')->on('packages')->cascadeOnDelete();
            $table->string('cloudinary_asset_id')->nullable()->unique();
            $table->string('public_id')->nullable()->unique();
            $table->string('status')->default('PENDING');
            $table->string('resource_type')->default('image');
            $table->string('format')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('bytes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_media');
    }
};
