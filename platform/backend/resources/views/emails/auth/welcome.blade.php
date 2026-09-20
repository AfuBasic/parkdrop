@extends('emails.layouts.transactional')

@section('preheader', "Welcome to ParkDrop, {$firstName}! Your pickup point is set up and ready.")

@section('content')
<h1 style="color: #0F172A; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 12px 0;">Welcome to ParkDrop, {{ $firstName }}!</h1>

<p style="color: #475569; font-size: 16px; margin: 0 0 28px 0; line-height: 1.5;">
    Your account and pickup point <strong style="color: #0F172A;">{{ $pickupPointName }}</strong> are ready. ParkDrop helps your team log parcels swiftly, notify recipients in seconds, and ensure zero misplaced packages.
</p>

<!-- Welcome Credits Callout Banner -->
<div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 20px 24px; margin: 0 0 32px 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td width="36" valign="top" style="padding-right: 14px;">
                <!-- SMS Credit Icon -->
                <div style="width: 36px; height: 36px; background-color: #DBEAFE; border-radius: 10px; text-align: center; line-height: 36px;">
                    <span style="font-size: 18px; color: #1D4ED8;">&#x2709;</span>
                </div>
            </td>
            <td valign="middle">
                <div style="color: #1E3A8A; font-size: 15px; font-weight: 800; margin-bottom: 2px;">
                    {{ $initialCredits }} Free SMS Credits Added
                </div>
                <div style="color: #3B82F6; font-size: 13px; font-weight: 500; line-height: 1.4;">
                    You can start dispatching instant pickup SMS notifications immediately at no cost.
                </div>
            </td>
        </tr>
    </table>
</div>

<!-- Key Features Section -->
<h2 style="color: #0F172A; font-size: 17px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.01em;">
    How ParkDrop works for your location:
</h2>

<!-- Feature 1: Rapid Package Logging -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
    <tr>
        <td width="42" valign="top" style="padding-right: 14px;">
            <div style="width: 38px; height: 38px; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 10px; text-align: center; line-height: 38px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
            </div>
        </td>
        <td valign="top">
            <div style="color: #0F172A; font-size: 15px; font-weight: 700; margin-bottom: 3px;">
                Quick Parcel Logging
            </div>
            <div style="color: #64748B; font-size: 14px; line-height: 1.45;">
                Record arrived parcels in seconds. Works completely offline on your phone or counter device even when connection is spotty.
            </div>
        </td>
    </tr>
</table>

<!-- Feature 2: Instant SMS Notifications & Verified Pickups -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
    <tr>
        <td width="42" valign="top" style="padding-right: 14px;">
            <div style="width: 38px; height: 38px; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 10px; text-align: center; line-height: 38px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                </svg>
            </div>
        </td>
        <td valign="top">
            <div style="color: #0F172A; font-size: 15px; font-weight: 700; margin-bottom: 3px;">
                Verified Token Releases
            </div>
            <div style="color: #64748B; font-size: 14px; line-height: 1.45;">
                Customers receive an automated SMS with their pickup code. Verify the 4-digit code on handoff to prevent mistaken releases.
            </div>
        </td>
    </tr>
</table>

<!-- Primary CTA Button -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 32px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="background-color: #2563EB; border-radius: 12px;">
                        <a href="{{ $appUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px;">
                            Go to Your Dashboard &rarr;
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Support Sign-off -->
<div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
    <p style="color: #64748B; font-size: 14px; margin: 0; line-height: 1.5;">
        Need help getting your team started? Simply reply to this email or reach us at <a href="mailto:support@parkdrop.com.ng" style="color: #2563EB; text-decoration: underline; font-weight: 600;">support@parkdrop.com.ng</a>.
    </p>
</div>
@endsection
