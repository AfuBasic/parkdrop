<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RequestChallengeRequest extends FormRequest
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
    protected function prepareForValidation(): void
    {
        if (! $this->has('purpose') || empty($this->input('purpose'))) {
            $this->merge(['purpose' => 'auth']);
        }
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'purpose' => 'sometimes|string|in:auth,login,registration,pin_reset,new_device',
            'device_uuid' => 'nullable|string|max:255',
        ];
    }
}
