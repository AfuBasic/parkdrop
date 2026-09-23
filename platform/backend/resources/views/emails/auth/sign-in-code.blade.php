@extends('emails.layouts.transactional')

@section('preheader', "Your ParkDrop sign-in code expires in {$expiryMinutes} minutes.")

@section('content')
<h1 style="color: #0D1B2A; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 10px 0;">Your sign-in code</h1>

<p style="color: #475569; font-size: 16px; font-weight: 500; margin: 0 0 28px 0; line-height: 1.5;">
    Use this code to continue to ParkDrop.
</p>

<!-- Code panel, six boxes -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
    <tr>
        @foreach (str_split($code) as $digit)
        <td width="{{ 100 / strlen($code) }}%" align="center" style="padding: 0 4px;">
            <div style="background-color: #EFF6FF; border: 2px solid #DBEAFE; border-radius: 12px; height: 62px; line-height: 62px; text-align: center; color: #0D1B2A; font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums;">
                {{ $digit }}
            </div>
        </td>
        @endforeach
    </tr>
</table>

<p style="color: #475569; font-size: 15px; font-weight: 600; margin: 0 0 28px 0; line-height: 1.5;">
    This code stops working in {{ $expiryMinutes }} minutes.
</p>

<!-- Security notice -->
<div style="background-color: #FFFBEB; border-radius: 12px; padding: 16px 18px; margin: 0 0 8px 0;">
    <p style="color: #92400E; font-size: 14px; font-weight: 700; margin: 0 0 4px 0; line-height: 1.5;">
        Keep this code to yourself.
    </p>
    <p style="color: #92400E; font-size: 14px; font-weight: 500; margin: 0; line-height: 1.5;">
        Nobody from ParkDrop will ever ask you for it.
    </p>
</div>

<p style="color: #94A3B8; font-size: 13px; font-weight: 500; margin: 16px 0 0 0; line-height: 1.5;">
    Did not ask for this code? You can ignore this email. Your account is safe.
</p>
@endsection
