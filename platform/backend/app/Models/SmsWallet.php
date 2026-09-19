<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsWallet extends Model
{
    protected $fillable = [
        'business_id',
        'balance',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function transactions()
    {
        return $this->hasMany(SmsCreditTransaction::class);
    }
}
