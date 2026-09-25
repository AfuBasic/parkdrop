<?php

namespace App\Services;

use App\Jobs\SendAdminOtp;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminOtpService
{
    public function requestOtp(string $email): void
    {
        $email = Str::lower($email);

        AdminUser::updateOrCreate(
            ['email' => $email],
            ['email_verified_at' => null]
        );

        $this->issueCode($email);
    }

    public function issueCode(string $email): void
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put("admin_otp:{$email}", [
            'code' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10)->timestamp,
        ], now()->addMinutes(10));

        SendAdminOtp::dispatch($email, $code);
    }

    public function verifyOtp(string $email, string $code): void
    {
        $email = Str::lower($email);
        $key = "admin_otp:{$email}";
        $record = Cache::get($key);

        if (!$record) {
            throw new \RuntimeException('No active code. Please request a new one.');
        }

        if (now()->timestamp > $record['expires_at']) {
            Cache::forget($key);
            throw new \RuntimeException('Code expired. Please request a new one.');
        }

        $record['attempts']++;

        if ($record['attempts'] > 5) {
            Cache::forget($key);
            throw new \RuntimeException('Too many attempts. Please request a new code.');
        }

        if (!Hash::check($code, $record['code'])) {
            Cache::put($key, $record, now()->addMinutes(10));
            $remaining = 5 - $record['attempts'];
            throw new \RuntimeException("Invalid code. {$remaining} attempts remaining.");
        }

        Cache::forget($key);
    }

    public function recordLogin(AdminUser $admin): void
    {
        $admin->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);
    }
}
