<?php

namespace App\Actions\Sms;

use App\Models\Package;
use Illuminate\Support\Facades\DB;

class ResendArrivalSmsAction
{
    /**
     * Queue a fresh ARRIVAL_SMS_REQUESTED outbox event for a package that
     * already has one — reuses the same outbox → scheduler → SendArrivalSmsJob
     * pipeline as the original send, so it gets the same retry, wallet-charge,
     * and sync_changes behaviour for free instead of duplicating any of it.
     */
    public function execute(Package $package): void
    {
        DB::table('outbox_events')->insert([
            'business_id' => $package->business_id,
            'type' => 'ARRIVAL_SMS_REQUESTED',
            'payload' => json_encode(['package_id' => $package->id]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
