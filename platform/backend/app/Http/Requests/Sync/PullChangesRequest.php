<?php

namespace App\Http\Requests\Sync;

use Illuminate\Foundation\Http\FormRequest;

class PullChangesRequest extends FormRequest
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
            'cursor' => ['nullable', 'integer', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
        ];
    }
}
