<?php

namespace App\Services\Auth;

use App\Models\AuthChallenge;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthChallengeService
{
    public function __construct(private OtpMailer $mailer) {}

    /**
     * Generate and send a new OTP code.
     */
    public function createChallenge(string $email, string $purpose, ?string $deviceUuid = null): AuthChallenge
    {
        $normalizedEmail = strtolower(trim($email));
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiryMinutes = config('otp.expiry', 10);
        $maxAttempts = config('otp.max_verify_attempts', 5);

        $challenge = DB::transaction(function () use ($normalizedEmail, $code, $purpose, $deviceUuid, $expiryMinutes, $maxAttempts) {
            $challenge = AuthChallenge::create([
                'email' => $normalizedEmail,
                'code_hash' => Hash::make($code),
                'purpose' => $purpose,
                'expires_at' => now()->addMinutes($expiryMinutes),
                'device_uuid' => $deviceUuid,
                'max_attempts' => $maxAttempts,
            ]);

            DB::afterCommit(function () use ($normalizedEmail, $code) {
                $this->mailer->sendOtp($normalizedEmail, $code);
            });

            return $challenge;
        });

        return $challenge;
    }

    /**
     * Verify an OTP code.
     */
    public function verifyChallenge(string $email, string $code, string $purpose): ?AuthChallenge
    {
        $normalizedEmail = strtolower(trim($email));

        return DB::transaction(function () use ($normalizedEmail, $code, $purpose) {
            $maxAttempts = config('otp.max_verify_attempts', 5);

            // Find the most recent active challenge for this email and purpose with a row lock
            $challenge = AuthChallenge::where('email', $normalizedEmail)
                ->where('purpose', $purpose)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->where('attempt_count', '<', $maxAttempts)
                ->lockForUpdate()
                ->latest()
                ->first();

            if (! $challenge) {
                return null; // No valid challenge found
            }

            $challenge->increment('attempt_count');

            if (! Hash::check($code, $challenge->code_hash)) {
                return null; // Invalid code
            }

            // Code is valid
            $challenge->update(['used_at' => now()]);

            return $challenge;
        });
    }
}
