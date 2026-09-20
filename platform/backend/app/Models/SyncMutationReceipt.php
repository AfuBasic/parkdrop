<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncMutationReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'mutation_id',
        'device_uuid',
        'device_sequence',
        'user_id',
        'business_id',
        'operation',
        'payload_hash',
        'result_status',
        'result_metadata',
        'processed_at',
    ];

    protected $casts = [
        'result_metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'device_uuid', 'uuid');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
