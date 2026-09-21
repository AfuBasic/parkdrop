@extends('emails.layouts.transactional')

@section('preheader', "{$inviterName} invited you to join {$businessName} on ParkDrop.")

@section('content')
<h1 style="color: #0D1B2A; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 10px 0;">Join {{ $businessName }} on ParkDrop</h1>

<p style="color: #475569; font-size: 16px; font-weight: 500; margin: 0 0 24px 0; line-height: 1.5;">
    <strong style="color: #0D1B2A;">{{ $inviterName }}</strong> invited you to join <strong style="color: #0D1B2A;">{{ $businessName }}</strong> as <strong style="color: #2563EB;">{{ $roleName }}</strong>.
</p>

<!-- Callout -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EFF6FF; border-radius: 14px; margin: 0 0 28px 0;">
    <tr>
        <td style="padding: 18px 20px;">
            <div style="color: #163B8C; font-size: 15px; font-weight: 800; margin-bottom: 4px;">
                Sign in with {{ $inviteeEmail }}
            </div>
            <div style="color: #163B8C; font-size: 14px; font-weight: 500; line-height: 1.45;">
                We will text or email you a 6-digit code — no password needed.
            </div>
        </td>
    </tr>
</table>

<!-- Primary CTA Button -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="background-color: #2563EB; border-radius: 14px;">
                        <a href="{{ $inviteUrl }}" target="_blank" style="display: block; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 14px; text-align: center;">
                            Accept invitation
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="color: #94A3B8; font-size: 13px; font-weight: 500; margin: 0 0 24px 0; line-height: 1.5;">
    This invitation stops working in {{ $expiryDays }} days. Not expecting it? You can ignore this email.
</p>

<div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
    <p style="color: #64748B; font-size: 13px; font-weight: 500; margin: 0; line-height: 1.5;">
        Button not working? Copy this link into your browser:<br>
        <span style="color: #2563EB; font-weight: 600; word-break: break-all;">{{ $inviteUrl }}</span>
    </p>
</div>
@endsection
