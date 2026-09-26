<?php

namespace App\Jobs;

use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendAdminOtp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $email, public string $code)
    {
        $this->onQueue(config('otp.queue', 'auth'));
    }

    public function handle(): void
    {
        Mail::raw("Your ParkDrop admin login code is: {$this->code}\n\nThis code expires in 10 minutes.", function ($message) {
            $message->to($this->email)
                ->subject('ParkDrop Admin Login Code');
        });
    }
}
