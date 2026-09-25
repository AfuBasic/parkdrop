import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EFF6FF] text-[#2563EB]',
    success: 'bg-[#F0FDF4] text-[#15803D]',
    warning: 'bg-[#FFFBEB] text-[#92400E]',
    error: 'bg-[#FEF2F2] text-[#B91C1C]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
