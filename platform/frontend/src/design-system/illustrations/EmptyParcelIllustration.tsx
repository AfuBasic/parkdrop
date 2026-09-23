import * as React from 'react';

export function EmptyParcelIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Dashed outer box representing an empty slot */}
      <path 
        d="M20 35 L60 15 L100 35 V85 L60 105 L20 85 V35Z" 
        stroke="var(--color-border-default)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeDasharray="6 6"
      />
      {/* Top lines */}
      <path 
        d="M20 35 L60 55 L100 35" 
        stroke="var(--color-border-default)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeDasharray="6 6"
      />
      <path 
        d="M60 55 V105" 
        stroke="var(--color-border-default)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeDasharray="6 6"
      />
      
      {/* Small floating tag */}
      <rect x="75" y="45" width="16" height="24" rx="3" fill="var(--color-surface-subtle)" stroke="var(--color-border-strong)" strokeWidth="2" />
      <circle cx="83" cy="52" r="2" fill="var(--color-border-strong)" />
      <path d="M79 60 H87 M79 64 H85" stroke="var(--color-border-strong)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
