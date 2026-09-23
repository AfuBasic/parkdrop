<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;

class ReportPolicy
{
    /**
     * Determine if the user can view daily operational reports for the business.
     */
    public function view(User $user, Business $business): bool
    {
        $membership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return false;
        }

        return in_array($membership->role, ['owner', 'manager'], true);
    }

    /**
     * Determine if the user can export daily operational reports for the business.
     */
    public function export(User $user, Business $business): bool
    {
        return $this->view($user, $business);
    }
}
