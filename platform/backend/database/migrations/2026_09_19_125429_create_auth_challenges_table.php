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
        Schema::create('auth_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('code_hash');
            $table->enum('purpose', ['login', 'registration', 'pin_reset', 'new_device']);
            $table->timestamp('expires_at');
            $table->integer('attempt_count')->default(0);
            $table->integer('max_attempts')->default(3);
            $table->timestamp('used_at')->nullable();
            $table->string('device_uuid')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auth_challenges');
    }
};
