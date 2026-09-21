<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PickupPoint extends Model
{
    protected $fillable = [
        'business_id',
        'public_id',
        'name',
        'park_name',
        'status',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($pickupPoint) {
            if (empty($pickupPoint->public_id)) {
                $pickupPoint->public_id = (string) Str::uuid();
            }
        });
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
