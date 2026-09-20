<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncChange extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'pickup_point_id',
        'entity_type',
        'entity_id',
        'operation',
        'entity_version',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function pickupPoint(): BelongsTo
    {
        return $this->belongsTo(PickupPoint::class);
    }
}
