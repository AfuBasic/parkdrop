import * as React from 'react';

interface AuthBackdropProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function AuthBackdrop({ className, ...props }: AuthBackdropProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Soft blue glow gradient */}
        <radialGradient id="pd-glow" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--color-pd-blue-500)" stopOpacity="0.15" />
          <stop offset="60%" stopColor="var(--color-pd-blue-600)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--color-pd-blue-600)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="pd-box-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-pd-blue-600)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-pd-blue-800)" stopOpacity="0.05" />
        </linearGradient>

        <linearGradient id="pd-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-pd-blue-600)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-pd-blue-600)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-pd-blue-600)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Atmospheric radial glow */}
      <circle cx="280" cy="220" r="220" fill="url(#pd-glow)" />

      {/* Modern isometric parcel composition */}
      <g transform="translate(180, 140)">
        {/* Shelf line */}
        <line x1="-120" y1="210" x2="220" y2="210" stroke="url(#pd-line-grad)" strokeWidth="2" strokeDasharray="6 4" />

        {/* Primary Isometric Parcel Box */}
        <g transform="translate(20, 40)">
          {/* Top Face */}
          <polygon
            points="0,-40 65,-75 130,-40 65,-5"
            fill="var(--color-pd-blue-500)"
            fillOpacity="0.1"
            stroke="var(--color-pd-blue-600)"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Left Face */}
          <polygon
            points="0,-40 65,-5 65,75 0,40"
            fill="var(--color-pd-blue-600)"
            fillOpacity="0.12"
            stroke="var(--color-pd-blue-600)"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Right Face */}
          <polygon
            points="65,-5 130,-40 130,40 65,75"
            fill="var(--color-pd-blue-700)"
            fillOpacity="0.08"
            stroke="var(--color-pd-blue-600)"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Box Sealing Tape Top */}
          <polygon
            points="25,-26 45,-37 105,-5 85,6"
            fill="var(--color-pd-blue-400)"
            fillOpacity="0.2"
          />

          {/* Verification / Security Badge on parcel */}
          <g transform="translate(25, 10)">
            <rect
              x="0"
              y="0"
              width="36"
              height="24"
              rx="4"
              fill="var(--color-surface-default)"
              stroke="var(--color-pd-blue-400)"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            {/* Barcode / pickup code motif */}
            <line x1="6" y1="6" x2="6" y2="18" stroke="var(--color-pd-blue-600)" strokeWidth="2" strokeOpacity="0.5" />
            <line x1="12" y1="6" x2="12" y2="18" stroke="var(--color-pd-blue-600)" strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="17" y1="6" x2="17" y2="18" stroke="var(--color-pd-blue-600)" strokeWidth="2.5" strokeOpacity="0.4" />
            <line x1="24" y1="6" x2="24" y2="18" stroke="var(--color-pd-blue-600)" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="29" y1="6" x2="29" y2="18" stroke="var(--color-pd-blue-600)" strokeWidth="2" strokeOpacity="0.5" />
          </g>
        </g>

        {/* Floating Pickup Token / Tag */}
        <g transform="translate(-50, 110)">
          <rect
            x="0"
            y="0"
            width="72"
            height="44"
            rx="10"
            fill="var(--color-surface-default)"
            stroke="var(--color-pd-blue-500)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            filter="drop-shadow(0 4px 12px rgba(37,99,235,0.08))"
          />
          <circle cx="14" cy="22" r="3.5" fill="var(--color-status-success)" fillOpacity="0.7" />
          <text
            x="24"
            y="26"
            fill="var(--color-pd-blue-700)"
            fillOpacity="0.65"
            fontSize="11"
            fontWeight="700"
            fontFamily="monospace"
            letterSpacing="1"
          >
            7K4P
          </text>
        </g>

        {/* Small background package */}
        <g transform="translate(-75, 50)">
          <polygon
            points="0,-22 35,-42 70,-22 35,-2"
            fill="var(--color-pd-blue-400)"
            fillOpacity="0.06"
            stroke="var(--color-pd-blue-500)"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <polygon
            points="0,-22 35,-2 35,38 0,18"
            fill="var(--color-pd-blue-500)"
            fillOpacity="0.08"
            stroke="var(--color-pd-blue-500)"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <polygon
            points="35,-2 70,-22 70,18 35,38"
            fill="var(--color-pd-blue-600)"
            fillOpacity="0.05"
            stroke="var(--color-pd-blue-500)"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
        </g>
      </g>
    </svg>
  );
}
