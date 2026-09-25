import React from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string; count?: number }[];
}

export function Tabs({ value, onValueChange, items }: TabsProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-xl w-fit">
      {items.map((item) => {
        const isActive = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white text-[#0D1B2A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0D1B2A] hover:bg-white/50'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
