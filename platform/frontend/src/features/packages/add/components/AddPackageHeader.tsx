import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/features/auth/components/Logo';
import { AddPackageStrings } from '../strings';

export interface AddPackageHeaderProps {
  onClose: () => void;
  collapsed?: boolean;
}

/**
 * Compact blue header for Add Package.
 * Displays Close pill on the left, title 'Add package' and logo.
 * Shrinks/collapses to one line when the keyboard is open.
 */
export function AddPackageHeader({ onClose, collapsed = false }: AddPackageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-[var(--pd-blue)] text-white relative flex-none px-4 pt-3 transition-all',
        collapsed ? 'pb-4' : 'pb-8'
      )}
    >
      <div className="mx-auto w-full max-w-[480px] flex items-center justify-between min-h-[var(--pd-tap-min)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={AddPackageStrings.close}
          className={cn(
            'inline-flex items-center gap-1.5 min-h-[var(--pd-tap-min)] px-3.5 rounded-full',
            'bg-white/20 text-white text-[15px] font-extrabold',
            'hover:bg-white/30 active:scale-[0.97] transition-transform',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50'
          )}
        >
          <X className="w-5 h-5" strokeWidth={2.75} aria-hidden="true" />
          <span>{AddPackageStrings.close}</span>
        </button>

        <h1 className="text-[20px] font-extrabold tracking-[-0.02em] text-white m-0">
          {AddPackageStrings.title}
        </h1>

        <div className="w-[80px] flex justify-end">
          <Logo tone="blue" markOnly />
        </div>
      </div>
    </header>
  );
}
