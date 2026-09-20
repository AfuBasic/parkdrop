<?php

namespace App\Actions\Sync;

use App\Models\Business;
use App\Models\SyncChange;

class PullChangesAction
{
    public function execute(Business $business, int $afterCursor, int $limit = 100): array
    {
        $changes = SyncChange::where('business_id', $business->id)
            ->where('id', '>', $afterCursor)
            ->orderBy('id', 'asc')
            ->limit($limit + 1)
            ->get();

        $hasMore = $changes->count() > $limit;
        if ($hasMore) {
            $changes->pop();
        }

        $nextCursor = $changes->last()?->id ?? $afterCursor;

        return [
            'changes' => $changes->map(fn ($change) => [
                'id' => $change->id,
                'entity_type' => $change->entity_type,
                'entity_id' => $change->entity_id,
                'operation' => $change->operation,
                'entity_version' => $change->entity_version,
                // In a real application, you might fetch canonical entity payload here based on type/id.
            ])->values()->all(),
            'cursor' => $nextCursor,
            'has_more' => $hasMore,
        ];
    }
}
