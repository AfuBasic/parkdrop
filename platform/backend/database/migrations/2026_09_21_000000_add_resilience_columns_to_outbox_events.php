<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add resilience tracking columns to outbox_events.
     *
     * - dispatched_at: set when the event is processed by ProcessOutboxCommand or
     *   SendArrivalSmsJob. NULL means undispatched.
     * - sms_status: tracks the SMS outcome: NULL (pending), SENT, FAILED, NEEDS_RECONCILIATION.
     *   Only applicable to ARRIVAL_SMS_REQUESTED event types.
     */
    public function up(): void
    {
        Schema::table('outbox_events', function (Blueprint $table) {
            $table->timestamp('dispatched_at')->nullable()->after('payload');
            $table->string('sms_status', 50)->nullable()->after('dispatched_at');

            // Index for the ProcessOutboxCommand to efficiently find undispatched events
            $table->index(['dispatched_at', 'type'], 'outbox_undispatched_idx');
        });
    }

    public function down(): void
    {
        Schema::table('outbox_events', function (Blueprint $table) {
            $table->dropIndex('outbox_undispatched_idx');
            $table->dropColumn(['dispatched_at', 'sms_status']);
        });
    }
};
