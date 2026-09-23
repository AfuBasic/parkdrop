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
        'contact_phone',
        'contact_phone_confirmed_at',
        'contact_phone_source',
        'status',
    ];

    protected $casts = [
        'contact_phone_confirmed_at' => 'datetime',
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

    public function phoneAudits()
    {
        return $this->hasMany(PickupPointPhoneAudit::class);
    }
}
