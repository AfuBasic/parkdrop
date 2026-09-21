import { cn } from '@/lib/utils';

/**
 * A small stack of kraft parcels with a real-looking label, for the first
 * day of the app.
 *
 * Same family as the sign-in HeroArt — inline SVG, kraft tokens, no extra
 * request and no layout shift — but sized for a card rather than a header,
 * and carrying the package id rather than a pickup code, because the empty
 * state is about the package that has not arrived yet.
 *
 * Purely decorative: the words beside it carry the meaning.
 */
export function FirstPackageArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 104"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none select-none', className)}
    >
      {/* Small box, resting on the large one */}
      <rect x="66" y="10" width="42" height="32" rx="4" fill="#E9C27F" />
      <rect x="66" y="10" width="42" height="9" rx="4" fill="var(--pd-kraft-2)" />
      <rect x="80" y="10" width="14" height="32" fill="var(--pd-kraft-4)" />

      {/* Large box */}
      <rect x="44" y="38" width="84" height="66" rx="5" fill="var(--pd-kraft-1)" />
      <rect x="44" y="38" width="84" height="13" rx="5" fill="var(--pd-kraft-2)" />
      <rect x="78" y="38" width="15" height="66" fill="var(--pd-kraft-4)" />

      {/* Package id label */}
      <rect x="88" y="60" width="42" height="19" rx="3" fill="#fff" />
      <text
        x="109"
        y="74"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontSize="10"
        fontWeight="800"
        fill="var(--pd-navy)"
      >
        PD-2841
      </text>

      {/* Medium box, left */}
      <rect x="2" y="56" width="52" height="48" rx="5" fill="var(--pd-kraft-3)" />
      <rect x="2" y="56" width="52" height="10" rx="5" fill="#C58C3F" />
      <rect x="10" y="56" width="12" height="48" fill="#F1DDB0" />
      <rect x="28" y="80" width="20" height="3" rx="1.5" fill="#B9852F" />
      <rect x="28" y="88" width="13" height="3" rx="1.5" fill="#B9852F" />
    </svg>
  );
}
