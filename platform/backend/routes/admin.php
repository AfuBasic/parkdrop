<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminPackagesController;
use App\Http\Controllers\Admin\AdminPickupPointsController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminSmsCreditsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminErrorLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    // Auth
    Route::middleware('guest.admin')->group(function () {
        Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
        Route::post('/login/request', [AdminAuthController::class, 'requestOtp'])->name('admin.login.request');
        Route::get('/login/verify', [AdminAuthController::class, 'showVerify'])->name('admin.login.verify');
        Route::post('/login/verify', [AdminAuthController::class, 'verifyOtp'])->name('admin.login.verify.post');
    });

    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

    // Protected
    Route::middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'show'])->name('admin.dashboard');

        Route::get('/pickup-points', [AdminPickupPointsController::class, 'index'])->name('admin.pickup-points');
        Route::get('/pickup-points/{id}', [AdminPickupPointsController::class, 'show'])->name('admin.pickup-points.show');

        Route::get('/packages', [AdminPackagesController::class, 'index'])->name('admin.packages');
        Route::get('/packages/{id}', [AdminPackagesController::class, 'show'])->name('admin.packages.show');

        Route::get('/users', [AdminUsersController::class, 'index'])->name('admin.users');

        Route::get('/sms-credits', [AdminSmsCreditsController::class, 'index'])->name('admin.sms-credits');
        Route::get('/finance', [AdminFinanceController::class, 'show'])->name('admin.finance');
        Route::get('/reports', [AdminReportsController::class, 'show'])->name('admin.reports');
        Route::get('/error-log', [AdminErrorLogController::class, 'index'])->name('admin.error-log');
        Route::get('/settings', [AdminSettingsController::class, 'show'])->name('admin.settings');
    });
});
