import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs sm:text-sm text-[#0D1B2A] placeholder:text-xs placeholder:text-[#94A3B8] outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] transition-all shadow-2xs disabled:opacity-50 disabled:bg-[#F8FAFC] ${className}`}
      {...props}
    />
  );
}
