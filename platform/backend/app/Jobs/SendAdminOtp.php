<?php

namespace App\Jobs;

use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAdminOtp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $email, public string $code)
    {
        $this->onQueue(config('otp.queue', 'auth'));
    }

    public function handle(): void
    {
        Log::info("[SendAdminOtp] Dispatching OTP email to {$this->email}");

        Mail::raw("Your ParkDrop admin login code is: {$this->code}\n\nThis code expires in 10 minutes.", function ($message) {
            $message->to($this->email)
                ->subject('ParkDrop Admin Login Code');
        });

        Log::info("[SendAdminOtp] OTP email successfully sent to {$this->email}");
    }

    public function failed(Throwable $exception): void
    {
        Log::error("[SendAdminOtp] Failed to deliver OTP to {$this->email}: {$exception->getMessage()}", [
            'exception' => $exception,
        ]);
    }
}
