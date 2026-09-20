<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'business_id',
        'package_id',
        'amount_minor',
        'method',
        'recorded_by_user_id',
        'recorded_by_device_uuid',
        'recorded_at',
        'client_recorded_at',
        'status',
        'reverses_payment_id',
        'reversal_reason',
        'version',
    ];

    protected $casts = [
        'amount_minor' => 'integer',
        'method' => PaymentMethod::class,
        'recorded_at' => 'datetime',
        'client_recorded_at' => 'datetime',
        'version' => 'integer',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }

    public function reversesPayment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'reverses_payment_id');
    }

    public function reversals(): HasMany
    {
        return $this->hasMany(Payment::class, 'reverses_payment_id');
    }
}
