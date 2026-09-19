<x-mail::message>
# Welcome to ParkDrop

Use the following 6-digit code to securely log in to your account. This code expires in 15 minutes.

<x-mail::panel>
# {{ $code }}
</x-mail::panel>

If you did not request this code, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
