<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthChallenge extends Model
{
    protected $fillable = [
        'email',
        'code_hash',
        'purpose',
        'expires_at',
        'attempt_count',
        'max_attempts',
        'used_at',
        'device_uuid',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function isValid(): bool
    {
        return is_null($this->used_at) 
            && $this->expires_at->isFuture() 
            && $this->attempt_count < $this->max_attempts;
    }
}
