import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AuthCodeFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const AuthCodeField = React.forwardRef<HTMLInputElement, AuthCodeFieldProps>(
  ({ className, error, value = '', ...props }, ref) => {
    const code = String(value);

    return (
      <div 
        className={cn(
          "relative flex gap-2 w-full",
          error && "animate-in shake"
        )} 
        role="group" 
        aria-label="6-digit code"
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const isFilled = i < code.length;
          const isActive = i === code.length;
          
          return (
            <span 
              key={i} 
              className={cn(
                "relative flex-1 h-[70px] grid place-items-center border-2 rounded-[14px] bg-white text-[34px] font-[800] text-text-primary tabular-nums transition-all duration-120",
                error 
                  ? "border-[var(--color-proto-bad)] bg-[var(--color-proto-badbg)]"
                  : isFilled 
                    ? "border-[var(--color-proto-blue)] bg-[var(--color-proto-tint)]"
                    : isActive
                      ? "border-[var(--color-proto-blue)] shadow-[0_0_0_4px_rgba(37,99,235,0.16)]"
                      : "border-border-strong",
                // Simulate the blinking cursor
                isActive && "after:content-[''] after:absolute after:w-0.5 after:h-[34px] after:bg-[var(--color-proto-blue)] after:animate-[blink_1s_steps(1)_infinite]"
              )}
            >
              {code.charAt(i)}
            </span>
          );
        })}
        
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          maxLength={6}
          value={value}
          className="absolute inset-0 w-full h-full opacity-0 border-0 p-0 text-[16px] caret-transparent z-10 cursor-text"
          {...props}
        />
        
        {/* We need this in global styles for the blink animation */}
        <style>{`
          @keyframes blink { 50% { opacity: 0; } }
          @keyframes shake {
            20% { transform: translateX(-7px); }
            40% { transform: translateX(7px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
          }
        `}</style>
      </div>
    );
  }
);
AuthCodeField.displayName = 'AuthCodeField';
