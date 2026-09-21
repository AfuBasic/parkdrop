@extends('emails.layouts.transactional')

@section('preheader', "You have been invited to join {$businessName} on ParkDrop.")

@section('content')
<h1 style="color: #0F172A; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 12px 0;">Join {{ $businessName }} on ParkDrop</h1>

<p style="color: #475569; font-size: 16px; margin: 0 0 24px 0; line-height: 1.5;">
    <strong>{{ $inviterName }}</strong> has invited you to join <strong style="color: #0F172A;">{{ $businessName }}</strong> on ParkDrop as <strong style="color: #2563EB;">{{ $roleName }}</strong>.
</p>

<!-- Callout Banner -->
<div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 20px 24px; margin: 0 0 32px 0;">
    <div style="color: #1E3A8A; font-size: 15px; font-weight: 800; margin-bottom: 4px;">
        Role: {{ $roleName }}
    </div>
    <div style="color: #3B82F6; font-size: 13px; font-weight: 500; line-height: 1.4;">
        Sign in to ParkDrop with your email (<strong>{{ $inviteeEmail }}</strong>) using a 6-digit email OTP to accept this invitation.
    </div>
</div>

<!-- Primary CTA Button -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 32px 0;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="background-color: #2563EB; border-radius: 12px;">
                        <a href="{{ $inviteUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px;">
                            Accept Invitation &rarr;
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="color: #64748B; font-size: 13px; margin: 0 0 24px 0; line-height: 1.4;">
    This invitation will expire in {{ $expiryDays }} days. If you were not expecting this invitation, you can safely ignore this email.
</p>

<div style="border-top: 1px solid #E2E8F0; padding-top: 20px;">
    <p style="color: #64748B; font-size: 13px; margin: 0; line-height: 1.5;">
        Button not working? Copy and paste this link into your browser:<br>
        <span style="color: #2563EB; word-break: break-all;">{{ $inviteUrl }}</span>
    </p>
</div>
@endsection
