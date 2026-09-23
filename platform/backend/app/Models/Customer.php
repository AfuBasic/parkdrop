<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'business_id',
        'name',
        'phone_display',
        'phone_normalized',
        'version',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }
}
