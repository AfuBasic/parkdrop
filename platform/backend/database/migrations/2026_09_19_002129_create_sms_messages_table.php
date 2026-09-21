<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * sms_messages tracks every outbound SMS from first PENDING through
     * Termii delivery confirmation. The row is created by SendArrivalSmsJob
     * before the send attempt and updated by the TermiiWebhookController or
     * the ReconcileSmsCommand.
     *
     * Status lifecycle:
     *   PENDING             — Job created the row, send not yet attempted.
     *   SENT                — Termii API accepted the message (messageId set).
     *   DELIVERED           — Termii webhook confirmed delivery.
     *   FAILED              — Definitively failed: provider rejected or all
     *                         retries exhausted.
     *   UNDELIVERED         — Termii confirmed non-delivery (e.g. unreachable
     *                         number).
     *   NEEDS_RECONCILIATION — Request timed out after connection; message
     *                         may or may not have been sent.
     */
    public function up(): void
    {
        Schema::create('sms_messages', function (Blueprint $table) {
            $table->id();

            // Business that owns this SMS
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();

            // The package that triggered the SMS (nullable: future SMS types may not have a package)
            $table->unsignedBigInteger('package_id')->nullable()->index();

            // The outbox event that triggered this send attempt (for cross-table correlation)
            $table->unsignedBigInteger('outbox_event_id')->nullable()->index();

            // Termii's own message identifier — used to correlate webhooks
            $table->string('termii_message_id', 100)->nullable()->unique();

            // Recipient phone in normalized international form (e.g. 2348012345678)
            $table->string('recipient_phone', 30);

            // Full message body as sent (for display in the activity timeline / audit)
            $table->text('message_body');

            // Current delivery status
            $table->string('status', 30)->default('PENDING')->index();

            // Timestamps from the SMS lifecycle
            $table->timestamp('sent_at')->nullable();          // Provider accepted
            $table->timestamp('delivered_at')->nullable();     // Termii confirmed delivery
            $table->timestamp('failed_at')->nullable();        // Definitively failed

            // Webhook tracking
            $table->timestamp('last_webhook_at')->nullable();
            $table->json('webhook_raw')->nullable();           // Last raw Termii webhook body

            // Human-readable error message for Attention Centre / timeline display
            $table->text('error_message')->nullable();

            $table->timestamps();

            // Composite index for the reconciliation command: find stale SENT rows
            $table->index(['status', 'sent_at'], 'sms_reconcile_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_messages');
    }
};
