<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'business_id',
        'pickup_point_id',
        'customer_id',
        'public_package_id',
        'pickup_code',
        'amount_due_minor',
        'status',
        'returned_at',
        'cancelled_at',
        'terminal_reason',
        'terminal_reason_note',
        'terminal_actor_name',
        'created_by_user_id',
        'created_by_device_uuid',
        'client_created_at',
        'version',
    ];

    protected $casts = [
        'client_created_at' => 'datetime',
        'returned_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'amount_due_minor' => 'integer',
        'version' => 'integer',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function outboxEvents(): HasMany
    {
        return $this->hasMany(OutboxEvent::class);
    }

    public function packageMedia(): HasMany
    {
        return $this->hasMany(PackageMedia::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function pickupPoint(): BelongsTo
    {
        return $this->belongsTo(PickupPoint::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function lifecycleEvent()
    {
        return $this->hasOne(PackageLifecycleEvent::class);
    }
}
