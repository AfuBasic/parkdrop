<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminOtpChallenge extends Model
{
    protected $fillable = [
        'admin_user_id',
        'email',
        'code',
        'ip_address',
        'user_agent',
        'attempts',
        'expires_at',
        'completed_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }

    public function isExpired(): bool
    {
        return now()->greaterThan($this->expires_at);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function isMaxAttemptsReached(int $max = 3): bool
    {
        return $this->attempts >= $max;
    }
}
