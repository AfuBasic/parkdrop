<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Outbound SMS message with full delivery-status lifecycle tracking.
 *
 * Status constants (mirrors the sms_messages.status column values):
 *
 *   PENDING              — Job created the row; send attempt not yet made.
 *   SENT                 — Termii API accepted the message (termii_message_id set).
 *   DELIVERED            — Termii webhook confirmed end-to-end delivery.
 *   FAILED               — Provider definitively rejected or all retries exhausted.
 *   UNDELIVERED          — Termii confirmed the message could not be delivered
 *                          (e.g. handset unreachable, wrong number).
 *   NEEDS_RECONCILIATION — Request timed out after connection established.
 *                          The message may or may not have been sent.
 *                          Never automatically re-send — must reconcile manually.
 */
class SmsMessage extends Model
{
    // ──────────────────────────────────────────────────────────────────────────
    // Status constants
    // ──────────────────────────────────────────────────────────────────────────

    public const STATUS_PENDING = 'PENDING';

    public const STATUS_SENT = 'SENT';

    public const STATUS_DELIVERED = 'DELIVERED';

    public const STATUS_FAILED = 'FAILED';

    public const STATUS_UNDELIVERED = 'UNDELIVERED';

    public const STATUS_NEEDS_RECONCILIATION = 'NEEDS_RECONCILIATION';

    /** Statuses that are considered "terminal" — no further updates expected. */
    public const TERMINAL_STATUSES = [
        self::STATUS_DELIVERED,
        self::STATUS_FAILED,
        self::STATUS_UNDELIVERED,
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Eloquent configuration
    // ──────────────────────────────────────────────────────────────────────────

    protected $fillable = [
        'business_id',
        'package_id',
        'outbox_event_id',
        'termii_message_id',
        'recipient_phone',
        'message_body',
        'status',
        'sent_at',
        'delivered_at',
        'failed_at',
        'last_webhook_at',
        'webhook_raw',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'failed_at' => 'datetime',
        'last_webhook_at' => 'datetime',
        'webhook_raw' => 'array',
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────────────

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Query scopes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Rows that need a delivery-status reconciliation check:
     * - SENT or NEEDS_RECONCILIATION status
     * - sent_at is older than $minutes minutes ago
     *
     * Used by ReconcileSmsCommand.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    public function scopePendingReconciliation($query, int $minutes = 30): \Illuminate\Database\Eloquent\Builder
    {
        return $query
            ->whereIn('status', [self::STATUS_SENT, self::STATUS_NEEDS_RECONCILIATION])
            ->where('sent_at', '<=', now()->subMinutes($minutes));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /** True when no further status updates are expected from Termii. */
    public function isTerminal(): bool
    {
        return in_array($this->status, self::TERMINAL_STATUSES, true);
    }

    /** True only when Termii explicitly confirmed end-to-end delivery. */
    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }
}
