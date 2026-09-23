import * as React from 'react';

export function ParcelPattern(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <pattern id="parcel-pattern" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
          {/* Subtle parcel box */}
          <path d="M20 15 l10 -5 l10 5 l-10 5 z" fill="currentColor" fillOpacity="0.05" />
          <path d="M20 15 v10 l10 5 v-10 z" fill="currentColor" fillOpacity="0.08" />
          <path d="M40 15 v10 l-10 5 v-10 z" fill="currentColor" fillOpacity="0.03" />
          
          {/* Tag shape */}
          <rect x="10" y="40" width="8" height="12" rx="2" fill="currentColor" fillOpacity="0.04" />
          <circle cx="14" cy="43" r="1.5" fill="currentColor" fillOpacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#parcel-pattern)" />
    </svg>
  );
}
