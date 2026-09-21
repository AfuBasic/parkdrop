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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'first_name' => 'required|string|max:255',
            'pickup_point_name' => 'required|string|max:255',
            'park_name' => 'nullable|string|max:255',
            'contact_phone' => ['required', 'string', 'regex:/^(?:\+?234|0)?[789][01]\d{8}$/'],
            'challenge_id' => 'required|integer|exists:auth_challenges,id',
            'device_uuid' => 'required|string|max:255',
            'device_name' => 'nullable|string|max:255',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $point = trim($this->input('pickup_point_name', ''));
            $park = trim($this->input('park_name', ''));
            $phone = trim($this->input('contact_phone', ''));

            // Format phone as 11 digits
            $digits = preg_replace('/\D/', '', $phone);
            if (str_starts_with($digits, '234') && strlen($digits) === 13) {
                $digits = '0' . substr($digits, 3);
            } elseif (! str_starts_with($digits, '0') && strlen($digits) === 10) {
                $digits = '0' . $digits;
            }

            $place = $park !== '' ? ($point !== '' ? "{$point}, {$park}" : $park) : $point;
            // Test with longest pickup code (7 chars)
            $sampleCode = 'ABCDEFG';
            $preview = "Your package is at {$place}.\nShow code {$sampleCode} at pickup.\nCall: {$digits}\nParkDrop";

            if (mb_strlen($preview) > 130) {
                $validator->errors()->add('pickup_point_name', 'The pickup point name, park name, and phone exceed the 130-character customer SMS limit.');
            }
        });
    }
}
