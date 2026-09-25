<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    public function showLogin() {
        return inertia('Admin/Auth/Login');
    }

    public function requestOtp(Request $request, AdminOtpService $otp) {
        $request->validate(['email' => 'required|email']);

        $otp->requestOtp($request->input('email'));

        $request->session()->put('admin_email', $request->input('email'));

        return response()->json(['status' => 'ok']);
    }

    public function showVerify(Request $request) {
        $email = $request->session()->get('admin_email');
        if (!$email) {
            return redirect('/admin/login');
        }
        return inertia('Admin/Auth/VerifyOtp', ['email' => $email]);
    }

    public function verifyOtp(Request $request, AdminOtpService $otp) {
        $email = $request->session()->get('admin_email');
        $code = $request->input('code');

        if (!$email) {
            return redirect('/admin/login');
        }

        try {
            $otp->verifyOtp($email, $code);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $admin = \App\Models\AdminUser::where('email', $email)->first();
        Auth::guard('admin')->login($admin);
        $request->session()->regenerate();

        $otp->recordLogin($admin);

        return response()->json(['status' => 'ok']);
    }

    public function logout(Request $request) {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        return redirect('/admin/login');
    }
}
