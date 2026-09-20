<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'status',
    ];

    public function memberships()
    {
        return $this->hasMany(BusinessMembership::class);
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
