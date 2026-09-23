<?php

namespace App\Http\Resources\Sync;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PushResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'results' => $this->resource,
        ];
    }
}
