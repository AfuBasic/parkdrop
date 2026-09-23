<?php

namespace App\Actions\Business;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class UpdateBusinessDetailsAction
{
    /**
     * Update basic business details (e.g. name) authoritatively.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        array $payload,
        User $actor
    ): Business {
        // Validate actor permissions: only OWNER can edit business settings
        $actorMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $actor->id)
            ->where('status', 'active')
            ->first();

        if (! $actorMembership) {
            throw new DomainException('UNAUTHORIZED');
        }

        if ($actorMembership->role !== 'owner') {
            throw new DomainException('FORBIDDEN');
        }

        $hasName = array_key_exists('name', $payload);
        $name = $hasName ? trim($payload['name']) : null;
        if ($hasName) {
            if (empty($name)) {
                throw new InvalidArgumentException('BUSINESS_NAME_REQUIRED');
            }
            if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
                throw new InvalidArgumentException('BUSINESS_NAME_INVALID_LENGTH');
            }
        }

        $hasDailyFee = array_key_exists('daily_storage_fee_minor', $payload);
        $dailyFee = $hasDailyFee ? (int) $payload['daily_storage_fee_minor'] : null;
        if ($hasDailyFee && $dailyFee < 0) {
            throw new InvalidArgumentException('DAILY_STORAGE_FEE_INVALID');
        }

        if (! $hasName && ! $hasDailyFee) {
            throw new InvalidArgumentException('NO_CHANGES_PROVIDED');
        }

        return DB::transaction(function () use ($business, $hasName, $name, $hasDailyFee, $dailyFee, $actor) {
            $lockedBusiness = Business::where('id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedBusiness) {
                throw new DomainException('BUSINESS_NOT_FOUND');
            }

            $updates = [];
            $logEntries = [];

            if ($hasName && $lockedBusiness->name !== $name) {
                $updates['name'] = $name;
                $logEntries[] = [
                    'type' => 'BUSINESS_NAME_CHANGED',
                    'payload' => ['old_name' => $lockedBusiness->name, 'new_name' => $name],
                ];
            }

            if ($hasDailyFee && $lockedBusiness->daily_storage_fee_minor !== $dailyFee) {
                $updates['daily_storage_fee_minor'] = $dailyFee;
                $logEntries[] = [
                    'type' => 'BUSINESS_DAILY_STORAGE_FEE_CHANGED',
                    'payload' => [
                        'old_daily_storage_fee_minor' => $lockedBusiness->daily_storage_fee_minor,
                        'new_daily_storage_fee_minor' => $dailyFee,
                    ],
                ];
            }

            if (empty($updates)) {
                return $lockedBusiness;
            }

            $lockedBusiness->update($updates);

            foreach ($logEntries as $entry) {
                ActivityLog::create([
                    'business_id' => $lockedBusiness->id,
                    'package_id' => null,
                    'user_id' => $actor->id,
                    'type' => $entry['type'],
                    'payload' => $entry['payload'],
                ]);
            }

            return $lockedBusiness;
        });
    }
}
