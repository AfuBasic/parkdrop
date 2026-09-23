<?php

namespace App\Services\Auth;

use App\Mail\AuthChallengeMail;
use Illuminate\Support\Facades\Mail;

class OtpMailer
{
    public function sendOtp(string $email, string $code): void
    {
        // We queue the mail so the API response isn't delayed by SMTP negotiation
        $message = (new AuthChallengeMail($code))->onQueue(config('otp.queue', 'auth'));
        Mail::to($email)->send($message);
    }
}
