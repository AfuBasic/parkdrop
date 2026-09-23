<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivacyAcknowledgement extends Model
{
    protected $fillable = [
        'user_id',
        'notice_version',
        'acknowledged_at',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
