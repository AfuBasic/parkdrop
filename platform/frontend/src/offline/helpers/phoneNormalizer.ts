export function normalizePhone(phone: string): string | null {
  const clean = phone.replace(/[^\d+]/g, '');

  if (!clean) return null;

  // 08031234567 -> 11 digits starting with 0
  const match1 = clean.match(/^0([789][01]\d{8})$/);
  if (match1) return `+234${match1[1]}`;

  // 8031234567 -> 10 digits starting with 7, 8, or 9
  const match2 = clean.match(/^([789][01]\d{8})$/);
  if (match2) return `+234${match2[1]}`;

  // 2348031234567 -> 13 digits starting with 234
  const match3 = clean.match(/^234([789][01]\d{8})$/);
  if (match3) return `+234${match3[1]}`;

  // +2348031234567 -> 14 chars starting with +234
  const match4 = clean.match(/^\+234([789][01]\d{8})$/);
  if (match4) return `+234${match4[1]}`;

  return null;
}

export function formatPhoneForDisplay(normalized: string): string {
  const match = normalized.match(/^\+234(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `0${match[1]} ${match[2]} ${match[3]}`;
  }
  return normalized;
}
