<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class AdminUser extends Authenticatable
{
    protected $fillable = ['email', 'email_verified_at', 'is_active', 'last_login_at', 'last_login_ip'];
}
