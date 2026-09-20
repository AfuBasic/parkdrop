export function formatMoney(amountInMinorUnits: number): string {
  // NGN minor unit is kobo, so divide by 100
  const amount = amountInMinorUnits / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  // Simple format for Nigerian phones if it's 11 digits starting with 0
  if (phone.length === 11 && phone.startsWith('0')) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  // If +234
  if (phone.startsWith('+234') && phone.length === 14) {
    return `0${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`;
  }
  return phone;
}
