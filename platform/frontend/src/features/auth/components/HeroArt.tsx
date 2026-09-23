import { cn } from '@/lib/utils';

/**
 * Kraft parcels sitting on the edge of the white sheet — the one memorable
 * illustration in the flow.
 *
 * Inline SVG (no extra request, no layout shift) and purely decorative, so it
 * is hidden from screen readers. Anchored bottom-right; the sheet is expected
 * to overlap its bottom ~28px, which is what makes the boxes look like they
 * are resting on it.
 *
 * The two white labels carry real-looking ParkDrop details: a pickup code and
 * a package id, the same two things the app is about.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 206 150"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none select-none', className)}
    >
      {/* Small box, resting on top of the large one */}
      <rect x="104" y="16" width="54" height="40" rx="4" fill="#E9C27F" />
      <rect x="104" y="16" width="54" height="12" rx="4" fill="var(--pd-kraft-2)" />
      <rect x="122" y="16" width="18" height="40" fill="var(--pd-kraft-4)" />

      {/* Large box */}
      <rect x="70" y="52" width="122" height="98" rx="5" fill="var(--pd-kraft-1)" />
      <rect x="70" y="52" width="122" height="18" rx="5" fill="var(--pd-kraft-2)" />
      <rect x="120" y="52" width="20" height="98" fill="var(--pd-kraft-4)" />
      <rect x="80" y="86" width="30" height="4" rx="2" fill="#B9852F" />
      <rect x="80" y="96" width="21" height="4" rx="2" fill="#B9852F" />

      {/* Pickup code label */}
      <rect x="146" y="82" width="38" height="28" rx="4" fill="#fff" />
      <text
        x="165"
        y="101"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill="var(--pd-navy)"
      >
        4821
      </text>

      {/* Medium box, left */}
      <rect x="4" y="82" width="74" height="68" rx="5" fill="var(--pd-kraft-3)" />
      <rect x="4" y="82" width="74" height="14" rx="5" fill="#C58C3F" />
      <rect x="14" y="82" width="16" height="68" fill="#F1DDB0" />

      {/* Package id label */}
      <rect x="36" y="100" width="38" height="18" rx="3" fill="#fff" />
      <text
        x="55"
        y="113"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontSize="9"
        fontWeight="800"
        fill="var(--pd-navy)"
      >
        PD-2841
      </text>
    </svg>
  );
}
