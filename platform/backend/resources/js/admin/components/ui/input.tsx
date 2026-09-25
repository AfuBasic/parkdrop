import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[17px] text-[#0D1B2A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] min-h-[48px] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
