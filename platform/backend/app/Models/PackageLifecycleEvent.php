<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageLifecycleEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'business_id',
        'package_id',
        'type',
        'reason',
        'reason_note',
        'actor_user_id',
        'device_uuid',
        'client_event_at',
        'server_received_at',
    ];

    protected $casts = [
        'client_event_at' => 'datetime',
        'server_received_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
