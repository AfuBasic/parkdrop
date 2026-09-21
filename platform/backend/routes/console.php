<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('parkdrop:scheduler-heartbeat')->everyMinute();

// Process the transactional outbox every minute.
// onOneServer() prevents double-dispatch when multiple scheduler instances are active.
// withoutOverlapping() prevents a slow batch from stacking with the next scheduled run.
Schedule::command('outbox:process')->everyMinute()->onOneServer()->withoutOverlapping(2);
