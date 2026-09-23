/**
 * Maps an email's domain to the inbox it actually opens.
 *
 * "Open Gmail" is only true for a Gmail address — sending a Yahoo or Outlook
 * user to mail.google.com opens someone else's empty inbox, which reads as
 * broken. Every entry here is a webmail URL that opens straight to the inbox
 * with no extra sign-in step for someone already logged in on the device.
 */
const WEBMAIL_PROVIDERS: Record<string, { url: string; label: string }> = {
  'gmail.com': { url: 'https://mail.google.com', label: 'Open Gmail' },
  'googlemail.com': { url: 'https://mail.google.com', label: 'Open Gmail' },
  'yahoo.com': { url: 'https://mail.yahoo.com', label: 'Open Yahoo Mail' },
  'yahoo.co.uk': { url: 'https://mail.yahoo.com', label: 'Open Yahoo Mail' },
  'ymail.com': { url: 'https://mail.yahoo.com', label: 'Open Yahoo Mail' },
  'outlook.com': { url: 'https://outlook.live.com/mail', label: 'Open Outlook' },
  'hotmail.com': { url: 'https://outlook.live.com/mail', label: 'Open Outlook' },
  'live.com': { url: 'https://outlook.live.com/mail', label: 'Open Outlook' },
  'icloud.com': { url: 'https://www.icloud.com/mail', label: 'Open iCloud Mail' },
  'me.com': { url: 'https://www.icloud.com/mail', label: 'Open iCloud Mail' },
};

export interface WebmailProvider {
  url: string;
  label: string;
}

/**
 * The webmail link for an email address, or null when the domain is not one
 * we recognise. Callers should hide the button rather than guess — a dead
 * link is worse than no button.
 */
export function webmailProviderFor(email: string): WebmailProvider | null {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return null;
  return WEBMAIL_PROVIDERS[domain] ?? null;
}
