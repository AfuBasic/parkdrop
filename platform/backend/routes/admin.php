<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminPackagesController;
use App\Http\Controllers\Admin\AdminPickupPointsController;
use App\Http\Controllers\Admin\AdminProfileController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminSmsCreditsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminErrorLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    // Root redirect
    Route::get('/', function () {
        if (auth('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('admin.login');
    })->name('admin.root');

    // Auth
    Route::middleware('guest.admin')->group(function () {
        Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
        Route::post('/login/request', [AdminAuthController::class, 'requestOtp'])->name('admin.login.request')->middleware('throttle:5,15');
        Route::get('/login/verify', [AdminAuthController::class, 'showVerify'])->name('admin.login.verify');
        Route::post('/login/verify', [AdminAuthController::class, 'verifyOtp'])->name('admin.login.verify.post')->middleware('throttle:10,15');
    });

    Route::match(['get', 'post'], '/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

    // Protected
    Route::middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'show'])->name('admin.dashboard');

        // Pickup points
        Route::get('/pickup-points', [AdminPickupPointsController::class, 'index'])->name('admin.pickup-points');
        Route::post('/pickup-points', [AdminPickupPointsController::class, 'store'])->name('admin.pickup-points.store');
        Route::get('/pickup-points/{id}', [AdminPickupPointsController::class, 'show'])->name('admin.pickup-points.show');
        Route::put('/pickup-points/{id}', [AdminPickupPointsController::class, 'update'])->name('admin.pickup-points.update');
        Route::post('/pickup-points/{id}/toggle', [AdminPickupPointsController::class, 'toggle'])->name('admin.pickup-points.toggle');

        // Packages
        Route::get('/packages', [AdminPackagesController::class, 'index'])->name('admin.packages');
        Route::get('/packages/{id}', [AdminPackagesController::class, 'show'])->name('admin.packages.show');

        // Users
        Route::get('/users', [AdminUsersController::class, 'index'])->name('admin.users');
        Route::post('/users', [AdminUsersController::class, 'store'])->name('admin.users.store');
        Route::put('/users/{id}', [AdminUsersController::class, 'update'])->name('admin.users.update');
        Route::post('/users/{id}/toggle', [AdminUsersController::class, 'toggle'])->name('admin.users.toggle');

        // SMS Credits
        Route::get('/sms-credits', [AdminSmsCreditsController::class, 'index'])->name('admin.sms-credits');
        Route::post('/sms-credits/allocate', [AdminSmsCreditsController::class, 'allocate'])->name('admin.sms-credits.allocate');

        // Finance & Reports
        Route::get('/finance', [AdminFinanceController::class, 'show'])->name('admin.finance');
        Route::get('/reports', [AdminReportsController::class, 'show'])->name('admin.reports');

        // Error Log
        Route::get('/error-log', [AdminErrorLogController::class, 'index'])->name('admin.error-log');
        Route::get('/error-log/stream', [AdminErrorLogController::class, 'stream'])->name('admin.error-log.stream');
        Route::post('/error-log/clear', [AdminErrorLogController::class, 'clear'])->name('admin.error-log.clear');

        // Profile
        Route::get('/profile', [AdminProfileController::class, 'show'])->name('admin.profile');

        // Legacy /settings route redirect
        Route::get('/settings', fn () => redirect()->route('admin.profile'));
    });
});
