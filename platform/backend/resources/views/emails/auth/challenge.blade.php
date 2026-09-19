<x-mail::message>
# Welcome to ParkDrop

Use the 6-digit confirmation code below to complete your sign in. This code is valid for 15 minutes.

<x-mail::panel>
<div style="font-family: monospace; font-size: 32px; letter-spacing: 6px; font-weight: bold; text-align: center; color: #1e3a8a;">
{{ $code }}
</div>
</x-mail::panel>

If you didn't request this code, you can safely ignore this message. No changes will be made to your account.

Warm regards,<br>
The {{ config('app.name') }} Team
</x-mail::message>
