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
        Schema::table('packages', function (Blueprint $table) {
            $table->timestamp('returned_at')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('returned_at');
            $table->string('terminal_reason', 50)->nullable()->after('cancelled_at');
            $table->string('terminal_reason_note', 300)->nullable()->after('terminal_reason');
            $table->string('terminal_actor_name', 100)->nullable()->after('terminal_reason_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn([
                'returned_at',
                'cancelled_at',
                'terminal_reason',
                'terminal_reason_note',
                'terminal_actor_name',
            ]);
        });
    }
};
