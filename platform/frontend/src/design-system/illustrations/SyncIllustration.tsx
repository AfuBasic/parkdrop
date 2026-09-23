import * as React from 'react';

export function SyncIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Solid parcel box in center */}
      <path d="M32 20 L44 26 L32 32 L20 26 L32 20Z" fill="var(--color-action-primary)" fillOpacity="0.2" />
      <path d="M20 26 V38 L32 44 V32 L20 26Z" fill="var(--color-action-primary)" fillOpacity="0.4" />
      <path d="M44 26 V38 L32 44 V32 L44 26Z" fill="var(--color-action-primary)" fillOpacity="0.1" />
      
      {/* Circular sync arrows */}
      <path 
        d="M20 16 C12 24 12 40 20 48" 
        stroke="var(--color-action-primary)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      <path d="M16 16 H22 V22" stroke="var(--color-action-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      <path 
        d="M44 48 C52 40 52 24 44 16" 
        stroke="var(--color-action-primary)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      <path d="M48 48 H42 V42" stroke="var(--color-action-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
