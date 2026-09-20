<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \Illuminate\Database\Eloquent\Concerns\HasUuids;

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
