<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'ParkDrop Admin')</title>
    @vite(['resources/js/admin/main.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
