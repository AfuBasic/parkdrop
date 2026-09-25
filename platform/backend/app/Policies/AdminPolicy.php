<?php

namespace App\Policies;

use App\Models\AdminUser;

/**
 * Admin authorization scaffolding.
 *
 * Currently every authenticated admin has full access to every resource.
 * As roles are added (e.g. park-admin, super-admin), add guards here
 * without changing controller signatures.
 *
 * To activate: register policies in AuthServiceProvider::$policies.
 */
class AdminPolicy
{
    /**
     * Super-admin bypasses every check.
     */
    protected function isSuperAdmin(AdminUser $admin): bool
    {
        // When roles are added: return $admin->role === 'super-admin';
        return true;
    }

    // ── Dashboard / Reports ──
    public function viewDashboard(AdminUser $admin): bool
    {
        return true;
    }

    public function viewReports(AdminUser $admin): bool
    {
        return true;
    }

    // ── Pickup points ──
    public function viewPickupPoints(AdminUser $admin): bool
    {
        return true;
    }

    public function createPickupPoint(AdminUser $admin): bool
    {
        return true;
    }

    public function updatePickupPoint(AdminUser $admin): bool
    {
        return true;
    }

    // ── Packages ──
    public function viewPackages(AdminUser $admin): bool
    {
        return true;
    }

    public function viewPackageDetail(AdminUser $admin): bool
    {
        return true;
    }

    public function updatePackage(AdminUser $admin): bool
    {
        return true;
    }

    // ── Users ──
    public function viewUsers(AdminUser $admin): bool
    {
        return true;
    }

    public function createUser(AdminUser $admin): bool
    {
        return true;
    }

    public function updateUser(AdminUser $admin): bool
    {
        return true;
    }

    // ── SMS Credits ──
    public function viewSmsCredits(AdminUser $admin): bool
    {
        return true;
    }

    public function allocateSmsCredits(AdminUser $admin): bool
    {
        return true;
    }

    // ── Finance ──
    public function viewFinance(AdminUser $admin): bool
    {
        return true;
    }

    // ── Error log ──
    public function viewErrorLog(AdminUser $admin): bool
    {
        return true;
    }

    public function clearErrorLog(AdminUser $admin): bool
    {
        return true;
    }

    // ── Profile ──
    public function viewProfile(AdminUser $admin): bool
    {
        return true;
    }
}
