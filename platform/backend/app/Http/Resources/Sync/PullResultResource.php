<?php

namespace App\Http\Resources\Sync;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PullResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'changes' => $this->resource['changes'],
            'cursor' => $this->resource['cursor'],
            'has_more' => $this->resource['has_more'],
        ];
    }
}
