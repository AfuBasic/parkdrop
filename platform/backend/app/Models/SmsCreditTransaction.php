<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsCreditTransaction extends Model
{
    protected $fillable = [
        'sms_wallet_id',
        'amount',
        'type',
        'reference_type',
        'reference_id',
    ];

    public function wallet()
    {
        return $this->belongsTo(SmsWallet::class, 'sms_wallet_id');
    }
}
