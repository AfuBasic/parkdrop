/**
 * Each provider's actual logo mark, pulled from their own live site
 * (paystack.com / flutterwave.com) and saved locally as static SVGs in
 * public/logos — not a third-party icon pack, and not a redrawn
 * approximation.
 */
export function PaystackLogo({ className }: { className?: string }) {
  return <img src="/logos/paystack-icon.svg" alt="" className={className} />;
}

export function FlutterwaveLogo({ className }: { className?: string }) {
  return <img src="/logos/flutterwave-icon.svg" alt="" className={className} />;
}
