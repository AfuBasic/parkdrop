<?php

namespace App\Actions\Auth;

use App\Models\AuthChallenge;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\PickupPoint;
use App\Models\PrivacyAcknowledgement;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompleteOwnerOnboardingAction
{
    public function execute(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $normalizedEmail = strtolower(trim($data['email']));

            // Verify challenge id for registration/auth to ensure they actually verified an OTP
            $challenge = AuthChallenge::findOrFail($data['challenge_id']);
            if (
                strtolower(trim($challenge->email)) !== $normalizedEmail ||
                ! in_array($challenge->purpose, ['auth', 'registration']) ||
                is_null($challenge->used_at)
            ) {
                abort(422, 'Invalid or unverified challenge provided for registration.');
            }

            // 1. Create or update User
            $user = User::firstOrCreate(
                ['email_normalized' => $normalizedEmail],
                [
                    'email' => $normalizedEmail,
                    'first_name' => $data['first_name'],
                    'email_verified_at' => now(),
                ]
            );

            // 2. Create Business
            $business = Business::create([
                'public_id' => Str::uuid()->toString(),
                'name' => $data['first_name']."'s Business", // Default name, can be changed later
                'status' => 'active',
            ]);

            // 3. Create Owner Membership
            BusinessMembership::create([
                'business_id' => $business->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            // 4. Create Pickup Point
            $pickupPoint = PickupPoint::create([
                'business_id' => $business->id,
                'public_id' => Str::uuid()->toString(),
                'name' => $data['pickup_point_name'],
                'park_name' => $data['park_name'] ?? null,
                'status' => 'active',
            ]);

            // 5. Register Device
            if (! empty($data['device_uuid'])) {
                UserDevice::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'device_uuid' => $data['device_uuid'],
                    ],
                    [
                        'device_name' => $data['device_name'] ?? 'Unknown Device',
                        'authorized_at' => now(),
                        'last_seen_at' => now(),
                    ]
                );
            }

            // 6. Create SMS Wallet & 7. Welcome Credits
            $wallet = SmsWallet::create([
                'business_id' => $business->id,
                'balance' => config('app.initial_sms_credits', 20),
            ]);

            SmsCreditTransaction::create([
                'sms_wallet_id' => $wallet->id,
                'amount' => config('app.initial_sms_credits', 20),
                'type' => 'credit',
                'reference_type' => 'WELCOME_CREDIT',
            ]);

            // 8. Privacy Acknowledgement
            PrivacyAcknowledgement::create([
                'user_id' => $user->id,
                'notice_version' => 'v1.0', // Hardcoded for now
                'acknowledged_at' => now(),
            ]);

            return [
                'user' => $user,
                'business' => $business,
                'pickup_point' => $pickupPoint,
            ];
        });
    }
}
