<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsCreditPurchase extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'business_id',
        'initiated_by_user_id',
        'bundle_key',
        'credits',
        'amount_minor',
        'currency',
        'status',
        'reference',
        'provider',
        'provider_reference',
        'provider_transaction_id',
        'provider_status',
        'checkout_url',
        'paid_at',
        'failed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'credits' => 'integer',
        'amount_minor' => 'integer',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function initiatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_user_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'PAID';
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['PENDING', 'PROCESSING'], true);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['PAID', 'FAILED', 'CANCELLED'], true);
    }
}
