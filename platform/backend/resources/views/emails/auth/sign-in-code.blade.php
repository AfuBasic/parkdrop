@extends('emails.layouts.transactional')

@section('preheader', "Your one-time ParkDrop code expires in {$expiryMinutes} minutes.")

@section('content')
<h1 style="color: #0F172A; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">Your sign-in code</h1>

<p style="color: #475569; font-size: 16px; margin: 0 0 32px 0; line-height: 1.5;">
    Use this code to continue to ParkDrop.
</p>

<!-- OTP Panel -->
<div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 32px; text-align: center; margin: 0 0 32px 0;">
    <div style="color: #0F172A; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
        {{ $code }}
    </div>
</div>

<p style="color: #475569; font-size: 16px; margin: 0 0 24px 0; line-height: 1.5;">
    This code expires in {{ $expiryMinutes }} minutes.
</p>

<!-- Security Notice -->
<div style="margin: 0 0 32px 0; border-top: 1px solid #E2E8F0; padding-top: 24px;">
    <p style="color: #64748B; font-size: 14px; margin: 0 0 16px 0; line-height: 1.5;">
        Keep this code private.<br>
        Do not share it with anyone.
    </p>
    
    <p style="color: #64748B; font-size: 14px; margin: 0; line-height: 1.5;">
        If you didn't request this code, you can safely ignore this email.
    </p>
</div>
@endsection
