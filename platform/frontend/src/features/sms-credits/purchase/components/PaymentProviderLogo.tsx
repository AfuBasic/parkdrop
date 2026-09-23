/**
 * Small brand-colour badges for the two payment providers.
 *
 * Not a pixel copy of either company's actual logo mark — this project has
 * no licensed logo assets to pull in, and fetching "a logo" from the web
 * risks grabbing the wrong or outdated file. A colour-accurate initial
 * badge is the same lightweight-logo pattern most payment pickers fall
 * back to when they don't ship real brand art, and is enough to make the
 * two options tell apart from each other at a glance.
 */
export function PaystackLogo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ backgroundColor: '#00C3F7' }}
      aria-hidden="true"
    >
      <span className="text-white font-extrabold">P</span>
    </span>
  );
}

export function FlutterwaveLogo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ backgroundColor: '#F5A623' }}
      aria-hidden="true"
    >
      <span className="text-white font-extrabold">F</span>
    </span>
  );
}
