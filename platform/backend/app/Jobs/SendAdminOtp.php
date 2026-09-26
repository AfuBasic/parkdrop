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
        Mail::send('emails.admin-otp', ['code' => $this->code], function ($message) {
            $message->to($this->email)
                ->subject('ParkDrop Admin Login Code');
        });
    }
}
