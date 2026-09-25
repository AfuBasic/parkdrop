<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSmsCreditsController extends Controller
{
    public function index(Request $request)
    {
        $pickupPoints = Business::query()
            ->with(['pickupPoints', 'smsWallet.transactions'])
            ->orderBy('name')
            ->get()
            ->map(function ($biz) {
                $point = $biz->pickupPoints->first();
                $wallet = $biz->smsWallet;
                $balance = (int) ($wallet?->balance ?? 0);

                $allocated = (int) ($wallet?->transactions->where('type', 'allocated')->sum('amount') ?? 0);
                $used = (int) ($wallet?->transactions->where('type', 'deducted')->sum('amount') ?? 0);

                return [
                    'id' => $biz->id,
                    'name' => $biz->name,
                    'park' => $point?->park_name ?? '—',
                    'contactPhone' => $point?->contact_phone ?? '—',
                    'balance' => $balance,
                    'allocated' => $allocated,
                    'used' => $used,
                    'status' => $balance <= 0 ? 'depleted' : ($balance < 100 ? 'low' : 'ok'),
                ];
            });

        $recentTransactions = SmsCreditTransaction::with('wallet.business.pickupPoints')
            ->latest('created_at')
            ->limit(25)
            ->get()
            ->map(function ($tx) {
                $biz = $tx->wallet?->business;
                $point = $biz?->pickupPoints?->first();
                return [
                    'id' => $tx->id,
                    'pickupPoint' => [
                        'name' => $biz?->name ?? '—',
                        'park' => $point?->park_name ?? '—',
                    ],
                    'amount' => (int) $tx->amount,
                    'type' => $tx->type,
                    'referenceType' => $tx->reference_type,
                    'createdAt' => $tx->created_at->toISOString(),
                ];
            });

        $overview = [
            'totalBalance' => $pickupPoints->sum('balance'),
            'totalAllocated' => $pickupPoints->sum('allocated'),
            'totalUsed' => $pickupPoints->sum('used'),
            'lowCount' => $pickupPoints->whereIn('status', ['low', 'depleted'])->count(),
        ];

        return inertia('Admin/SmsCredits', [
            'overview' => $overview,
            'pickupPoints' => $pickupPoints,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function allocate(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|exists:businesses,id',
            'amount' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            $wallet = SmsWallet::firstOrCreate(
                ['business_id' => $validated['business_id']],
                ['balance' => 0]
            );

            $wallet->increment('balance', $validated['amount']);

            SmsCreditTransaction::create([
                'sms_wallet_id' => $wallet->id,
                'amount' => $validated['amount'],
                'type' => 'allocated',
                'reference_type' => 'admin_grant',
                'reference_id' => auth('admin')->id() ?? 1,
            ]);
        });

        return redirect()->back()->with('success', "Allocated {$validated['amount']} SMS credits.");
    }
}
