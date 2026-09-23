<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class HeartbeatSchedulerCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'parkdrop:scheduler-heartbeat';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Record a scheduler heartbeat timestamp in cache for operational observability';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now()->toIso8601String();
        Cache::put('scheduler_last_heartbeat_at', $now, now()->addHours(2));

        $this->info("Scheduler heartbeat recorded: {$now}");

        return self::SUCCESS;
    }
}
