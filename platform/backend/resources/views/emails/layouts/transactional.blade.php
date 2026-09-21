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
        background-color: #EFF6FF;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper {
        width: 100%;
        background-color: #EFF6FF;
        padding: 40px 20px;
    }
    .email-container {
        max-width: 560px;
        margin: 0 auto;
        background-color: #FFFFFF;
        border-radius: 20px;
        overflow: hidden;
    }
    .email-banner {
        padding: 28px 40px;
        background-color: #2563EB;
        text-align: left;
    }
    .email-body {
        padding: 40px;
    }
    .email-footer {
        max-width: 560px;
        margin: 0 auto;
        padding: 28px 20px;
        text-align: center;
        color: #475569;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.6;
    }
    /* Mobile Responsive */
    @media screen and (max-width: 600px) {
        .email-wrapper {
            padding: 20px 12px !important;
        }
        .email-banner {
            padding: 22px 24px !important;
        }
        .email-body {
            padding: 28px 24px !important;
        }
        .email-footer {
            padding: 22px 16px !important;
        }
    }
</style>
</head>
<body style="background-color: #EFF6FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">

    <!-- Preheader Text (Invisible) -->
    <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #EFF6FF;">
        @yield('preheader', 'A message from ParkDrop.')
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #EFF6FF;">
        <tr>
            <td align="center" valign="top">

                <!-- Main Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px;">
                    <!-- Blue banner / logo -->
                    <tr>
                        <td align="left" class="email-banner" style="padding: 28px 40px; background-color: #2563EB;">
                            <a href="{{ config('app.frontend_url', 'https://parkdrop.com.ng') }}" target="_blank" style="text-decoration: none;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td valign="middle" style="background-color: #FFFFFF; border-radius: 9px; width: 34px; height: 34px; text-align: center; line-height: 34px;">
                                            <img src="{{ asset('images/parkdrop-icon-only.png') }}" alt="" border="0" width="22" height="22" style="width: 22px; height: 22px; display: inline-block; vertical-align: middle;">
                                        </td>
                                        <td valign="middle" style="padding-left: 11px; font-size: 19px; font-weight: 800; letter-spacing: -0.01em; color: #FFFFFF;">
                                            ParkDrop
                                        </td>
                                    </tr>
                                </table>
                            </a>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td align="left" class="email-body" style="padding: 40px;">
                            @yield('content')
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                    <tr>
                        <td align="center" class="email-footer" style="padding: 28px 20px; color: #475569; font-size: 13px; font-weight: 600; line-height: 1.6;">
                            ParkDrop, simple package pickup for local businesses.<br>
                            <a href="https://parkdrop.com.ng" style="color: #2563EB; text-decoration: none; font-weight: 700;">parkdrop.com.ng</a>
                            &nbsp;&middot;&nbsp;
                            <a href="https://parkdrop.com.ng/privacy.html" style="color: #2563EB; text-decoration: none; font-weight: 700;">Privacy Notice</a>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
