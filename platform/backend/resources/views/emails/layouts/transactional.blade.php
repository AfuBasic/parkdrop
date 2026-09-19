<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ $subject ?? 'ParkDrop' }}</title>
<style>
    /* Base Resets */
    body, table, td, div, p, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        margin: 0;
        padding: 0;
    }
    table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
    }
    img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
    }
    /* Structure */
    body {
        background-color: #F8FBFF;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper {
        width: 100%;
        background-color: #F8FBFF;
        padding: 40px 20px;
    }
    .email-container {
        max-width: 560px;
        margin: 0 auto;
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
    }
    .email-header {
        padding: 40px 40px 20px 40px;
        text-align: left;
    }
    .email-logo {
        height: 32px;
        width: auto;
    }
    .email-body {
        padding: 0 40px 40px 40px;
    }
    .email-footer {
        max-width: 560px;
        margin: 0 auto;
        padding: 30px 20px;
        text-align: center;
        color: #64748B;
        font-size: 13px;
        line-height: 1.5;
    }
    /* Mobile Responsive */
    @media screen and (max-width: 600px) {
        .email-wrapper {
            padding: 20px 16px !important;
        }
        .email-header {
            padding: 30px 24px 20px 24px !important;
        }
        .email-body {
            padding: 0 24px 30px 24px !important;
        }
        .email-footer {
            padding: 24px 16px !important;
        }
    }
</style>
</head>
<body style="background-color: #F8FBFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">
    
    <!-- Preheader Text (Invisible) -->
    <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #F8FBFF;">
        @yield('preheader', 'A message from ParkDrop.')
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #F8FBFF;">
        <tr>
            <td align="center" valign="top">
                
                <!-- Main Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px;">
                    <!-- Header / Logo -->
                    <tr>
                        <td align="left" class="email-header" style="padding: 40px 40px 20px 40px;">
                            <a href="{{ config('app.frontend_url', 'https://parkdrop.com.ng') }}" target="_blank" style="text-decoration: none;">
                                <img src="{{ asset('images/parkdrop-logo.png') }}" alt="ParkDrop" border="0" class="email-logo" style="height: 32px; width: auto; display: block;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td align="left" class="email-body" style="padding: 0 40px 40px 40px;">
                            @yield('content')
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                    <tr>
                        <td align="center" class="email-footer" style="padding: 30px 20px; color: #64748B; font-size: 13px; line-height: 1.5;">
                            ParkDrop<br>
                            Simple parcel management for pickup points.<br>
                            <a href="https://parkdrop.com.ng" style="color: #64748B; text-decoration: none;">parkdrop.com.ng</a>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
