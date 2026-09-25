import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  size?: 'default' | 'sm';
}

export function Button({ className = '', variant = 'primary', size = 'default', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors disabled:opacity-50 min-h-[48px]';
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#163B8C]',
    outline: 'border border-[#CBD5E1] text-[#0D1B2A] hover:bg-[#F1F5F9]',
  };
  const sizes = { default: 'px-5 py-3 text-lg', sm: 'px-3 py-2 text-sm' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
