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
        Schema::create('sync_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pickup_point_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('entity_type');
            $table->string('entity_id');
            $table->string('operation');
            $table->unsignedInteger('entity_version')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'id']);
            $table->index(['business_id', 'pickup_point_id', 'id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_changes');
    }
};
