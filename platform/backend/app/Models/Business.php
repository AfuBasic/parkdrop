<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Business extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'status',
        'daily_storage_fee_minor',
    ];

    protected $casts = [
        'daily_storage_fee_minor' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($business) {
            if (empty($business->public_id)) {
                $business->public_id = (string) Str::uuid();
            }
        });
    }

    public function memberships()
    {
        return $this->hasMany(BusinessMembership::class);
    }

    public function invitations()
    {
        return $this->hasMany(BusinessInvitation::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function pickupPoints()
    {
        return $this->hasMany(PickupPoint::class);
    }

    public function smsWallet()
    {
        return $this->hasOne(SmsWallet::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }
}
