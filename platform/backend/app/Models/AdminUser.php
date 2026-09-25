<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminUser extends Model
{
    protected $fillable = ['email', 'email_verified_at', 'is_active', 'last_login_at', 'last_login_ip'];
}
