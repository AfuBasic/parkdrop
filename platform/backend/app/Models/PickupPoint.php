<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickupPoint extends Model
{
    protected $fillable = [
        'business_id',
        'public_id',
        'name',
        'park_name',
        'status',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
