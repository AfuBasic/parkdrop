@extends('emails.layouts.transactional')

@section('preheader', "You are ready, {$firstName}. Your pickup point is set up.")

@section('content')
<h1 style="color: #0D1B2A; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 10px 0;">You are ready, {{ $firstName }}.</h1>

<p style="color: #475569; font-size: 16px; font-weight: 500; margin: 0 0 24px 0; line-height: 1.5;">
    <strong style="color: #0D1B2A;">{{ $pickupPointName }}</strong> is set up on ParkDrop. Here is how it works.
</p>

<!-- Free SMS credit -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF4; border-radius: 14px; margin: 0 0 28px 0;">
    <tr>
        <td style="padding: 18px 20px;">
            <div style="color: #15803D; font-size: 15px; font-weight: 800; margin-bottom: 2px;">
                {{ $initialCredits }} free SMS credits added
            </div>
            <div style="color: #15803D; font-size: 14px; font-weight: 500; line-height: 1.45;">
                You can text customers as soon as a package arrives, at no cost.
            </div>
        </td>
    </tr>
</table>

<!-- Step 1 -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
    <tr>
        <td width="40" valign="top" style="padding-right: 14px;">
            <div style="width: 34px; height: 34px; background-color: #2563EB; border-radius: 10px; text-align: center; line-height: 34px; color: #FFFFFF; font-size: 15px; font-weight: 800;">
                1
            </div>
        </td>
        <td valign="top">
            <div style="color: #0D1B2A; font-size: 15px; font-weight: 700; margin-bottom: 3px;">
                Add a package in seconds
            </div>
            <div style="color: #64748B; font-size: 14px; font-weight: 500; line-height: 1.45;">
                Works even with no signal — it saves on the phone and sends once you are back online.
            </div>
        </td>
    </tr>
</table>

<!-- Step 2 -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
    <tr>
        <td width="40" valign="top" style="padding-right: 14px;">
            <div style="width: 34px; height: 34px; background-color: #2563EB; border-radius: 10px; text-align: center; line-height: 34px; color: #FFFFFF; font-size: 15px; font-weight: 800;">
                2
            </div>
        </td>
        <td valign="top">
            <div style="color: #0D1B2A; font-size: 15px; font-weight: 700; margin-bottom: 3px;">
                Customers get a text and a code
            </div>
            <div style="color: #64748B; font-size: 14px; font-weight: 500; line-height: 1.45;">
                They show the code at pickup, so the right package always goes to the right person.
            </div>
        </td>
    </tr>
</table>

<!-- Primary CTA Button -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="background-color: #2563EB; border-radius: 14px;">
                        <a href="{{ $appUrl }}" target="_blank" style="display: block; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 14px; text-align: center;">
                            Add your first package
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- Support Sign-off -->
<div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
    <p style="color: #64748B; font-size: 14px; font-weight: 500; margin: 0; line-height: 1.5;">
        Need a hand? Reply to this email or write to <a href="mailto:support@parkdrop.com.ng" style="color: #2563EB; text-decoration: underline; font-weight: 700;">support@parkdrop.com.ng</a>.
    </p>
</div>
@endsection
