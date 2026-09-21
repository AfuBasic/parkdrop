<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\SmsMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles incoming delivery-status callbacks from Termii.
 *
 * Endpoint: POST /webhooks/termii/delivery
 * Auth:     HMAC SHA-512 via X-Termii-Signature header (if secret is configured).
 *
 * Termii webhook payload shape:
 * {
 *   "id":         "request-uuid",      // request ID (NOT the per-message ID)
 *   "message_id": "msg-uuid",          // matches SmsMessage.termii_message_id
 *   "receiver":   "2348012345678",
 *   "sender":     "Kontrol",
 *   "message":    "Hi there…",
 *   "sent_at":    "2024-01-01 10:00:00",
 *   "status":     "Delivered",         // see STATUS_MAP below
 *   "channel":    "generic",
 *   "cost":       "1"
 * }
 *
 * Termii status strings (case-insensitive comparison used throughout):
 *   "Delivered"                    → STATUS_DELIVERED
 *   "Message Sent"                 → STATUS_SENT (already sent; no change needed)
 *   "Message Failed"               → STATUS_FAILED
 *   "DND Active on Phone Number"   → STATUS_UNDELIVERED (DND block)
 *   "Rejected"                     → STATUS_UNDELIVERED
 *   "Expired"                      → STATUS_UNDELIVERED
 *   Any other value                → logged but status not overwritten to avoid
 *                                    regression from unknown intermediate states.
 */
class TermiiWebhookController extends Controller
{
    /**
     * Maps Termii status strings (lowercased) to internal SmsMessage status constants.
     * Keys are lowercase for case-insensitive matching.
     */
    private const STATUS_MAP = [
        'delivered' => SmsMessage::STATUS_DELIVERED,
        'message sent' => SmsMessage::STATUS_SENT,
        'message failed' => SmsMessage::STATUS_FAILED,
        'dnd active on phone number' => SmsMessage::STATUS_UNDELIVERED,
        'rejected' => SmsMessage::STATUS_UNDELIVERED,
        'expired' => SmsMessage::STATUS_UNDELIVERED,
    ];

    public function handle(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();

        // ── 1. Signature verification ─────────────────────────────────────────
        $secret = config('services.termii.webhook_secret');

        if (! empty($secret)) {
            $signatureHeader = (string) (
                $request->header('X-Termii-Signature') ??
                $request->header('x-termii-signature') ??
                ''
            );

            $expected = hash_hmac('sha512', $rawBody, $secret);

            if (! hash_equals($expected, $signatureHeader)) {
                Log::warning('[TermiiWebhook] Signature verification failed.', [
                    'ip' => $request->ip(),
                    'signature_present' => ! empty($signatureHeader),
                ]);

                return response()->json(['message' => 'Invalid signature.'], 400);
            }
        } else {
            // Log when running without a secret so operators know to configure it.
            Log::debug('[TermiiWebhook] No webhook secret configured — skipping signature check.');
        }

        // ── 2. Parse payload ──────────────────────────────────────────────────
        $payload = $request->all();

        $termiiMessageId = $payload['message_id'] ?? null;
        $rawStatus = $payload['status'] ?? null;

        if (! $termiiMessageId) {
            Log::warning('[TermiiWebhook] Payload missing message_id — ignoring.', [
                'payload' => $payload,
            ]);

            // Return 200 so Termii does not retry a malformed payload indefinitely.
            return response()->json(['message' => 'Missing message_id.'], 200);
        }

        // ── 3. Look up the sms_messages row ───────────────────────────────────
        $smsRecord = SmsMessage::where('termii_message_id', $termiiMessageId)->first();

        if (! $smsRecord) {
            Log::info('[TermiiWebhook] No sms_messages row for message_id — ignoring.', [
                'termii_message_id' => $termiiMessageId,
            ]);

            // Return 200 so Termii does not keep retrying for messages we didn't send
            // (e.g. test messages sent directly from the Termii dashboard).
            return response()->json(['message' => 'Unknown message_id.'], 200);
        }

        // ── 4. Map status string to internal constant ─────────────────────────
        $normalizedStatus = strtolower(trim((string) $rawStatus));
        $internalStatus = self::STATUS_MAP[$normalizedStatus] ?? null;

        if ($internalStatus === null) {
            Log::info('[TermiiWebhook] Unrecognised status string — recording webhook but not updating status.', [
                'termii_message_id' => $termiiMessageId,
                'raw_status' => $rawStatus,
            ]);

            // Still record the raw webhook so ops can inspect it.
            $smsRecord->update([
                'last_webhook_at' => now(),
                'webhook_raw' => $payload,
            ]);

            return response()->json(['message' => 'Received.'], 200);
        }

        // ── 5. Skip downgrade: never move a terminal status backward ──────────
        // e.g. a late "Message Sent" callback must not overwrite an already-DELIVERED row.
        if ($smsRecord->isTerminal() && $internalStatus === SmsMessage::STATUS_SENT) {
            Log::debug('[TermiiWebhook] Ignoring late SENT callback on terminal record.', [
                'termii_message_id' => $termiiMessageId,
                'current_status' => $smsRecord->status,
            ]);

            return response()->json(['message' => 'Received.'], 200);
        }

        // ── 6. Build the update payload ───────────────────────────────────────
        $updates = [
            'status' => $internalStatus,
            'last_webhook_at' => now(),
            'webhook_raw' => $payload,
        ];

        if ($internalStatus === SmsMessage::STATUS_DELIVERED && ! $smsRecord->delivered_at) {
            $updates['delivered_at'] = now();
        }

        if (
            in_array($internalStatus, [SmsMessage::STATUS_FAILED, SmsMessage::STATUS_UNDELIVERED], true)
            && ! $smsRecord->failed_at
        ) {
            $updates['failed_at'] = now();
            $updates['error_message'] = 'Termii reported: '.$rawStatus;
        }

        $smsRecord->update($updates);

        Log::info('[TermiiWebhook] SMS status updated.', [
            'termii_message_id' => $termiiMessageId,
            'new_status' => $internalStatus,
            'raw_status' => $rawStatus,
        ]);

        return response()->json(['message' => 'Received.'], 200);
    }
}
