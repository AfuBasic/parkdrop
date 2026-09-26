@component('mail::message')
# ParkDrop Admin Login

Your login code is:

**{{ $code ?? '' }}**

This code expires in 10 minutes. Do not share it with anyone.

@component('mail::subcopy')
If you did not request this code, you can ignore this email.
@endcomponent

@component('mail::footer')
ParkDrop — Afutunde Solutions
@endcomponent
@endcomponent
