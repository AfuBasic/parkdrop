<?php

namespace App\Services\Auth;

use App\Mail\AuthChallengeMail;
use Illuminate\Support\Facades\Mail;

class OtpMailer
{
    public function sendOtp(string $email, string $code): void
    {
        // We queue the mail so the API response isn't delayed by SMTP negotiation
        Mail::to($email)->send(new AuthChallengeMail($code));
    }
}
