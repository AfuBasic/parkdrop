import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  size?: 'default' | 'sm';
}

export function Button({ className = '', variant = 'primary', size = 'default', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer';
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#163B8C]',
    outline: 'border border-[#CBD5E1] text-[#0D1B2A] bg-white hover:bg-[#F1F5F9]',
  };
  const sizes = { default: 'px-4 py-2 text-xs sm:text-sm', sm: 'px-3 py-1.5 text-xs' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
