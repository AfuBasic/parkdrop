<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteOnboardingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'first_name' => 'required|string|max:255',
            'pickup_point_name' => 'required|string|max:255',
            'park_name' => 'nullable|string|max:255',
            'challenge_id' => 'required|integer|exists:auth_challenges,id',
            'device_uuid' => 'required|string|max:255',
            'device_name' => 'nullable|string|max:255',
        ];
    }
}
