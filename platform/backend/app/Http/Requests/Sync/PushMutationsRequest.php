<?php

namespace App\Http\Requests\Sync;

use Illuminate\Foundation\Http\FormRequest;

class PushMutationsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business_id' => ['nullable', 'integer', 'exists:businesses,id'],
            'device_uuid' => ['required', 'string', 'uuid'],
            'mutations' => ['required', 'array', 'max:100'],
            'mutations.*.mutation_id' => ['required', 'string', 'uuid'],
            'mutations.*.operation' => ['required', 'string'],
            'mutations.*.payload' => ['nullable', 'array'],
            'mutations.*.device_sequence' => ['nullable', 'integer'],
            'mutations.*.pickup_point_id' => ['nullable', 'integer'],
        ];
    }
}
