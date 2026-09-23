<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * mutation_id (already globally unique) is the real idempotency key —
     * PushMutationsAction checks it first, before anything ever reaches
     * device_sequence. This composite unique constraint served no other
     * purpose (nothing reads device_sequence back for ordering or business
     * logic), but actively broke pushes: the client's local sequence
     * counter can legitimately regress after its mutation queue drains and
     * restarts numbering, and every collision here threw an uncaught
     * exception that PushMutationsAction reported as RETRYABLE — jamming
     * the client's entire queue behind an endlessly-repeating failure.
     */
    public function up(): void
    {
        Schema::table('sync_mutation_receipts', function (Blueprint $table) {
            // The device_uuid foreign key needs its own supporting index before
            // MySQL will let us drop the composite unique index it currently
            // borrows for that purpose.
            $table->index('device_uuid');
            $table->dropUnique(['device_uuid', 'device_sequence']);
        });
    }

    public function down(): void
    {
        Schema::table('sync_mutation_receipts', function (Blueprint $table) {
            $table->unique(['device_uuid', 'device_sequence']);
            $table->dropIndex(['device_uuid']);
        });
    }
};
