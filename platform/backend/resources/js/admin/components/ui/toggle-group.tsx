import React from 'react';

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function ToggleGroup({ value, onValueChange, options }: ToggleGroupProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-[#F1F5F9] p-1 border border-[#E2E8F0]">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#0D1B2A]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
