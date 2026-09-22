import * as React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { HelpSheet } from '@/features/auth/components/HelpSheet';
import { cn } from '@/lib/utils';

/**
 * The header every settings-area and task screen wears.
 *
 * Design plan 02 §3.3.0 fixes three of the four constants of the signed-in
 * app in this one component, so they cannot drift screen to screen:
 *
 *  - **A way back**: top left, a left arrow *and the word "Back"*, 48px tall.
 *    Never a bare chevron.
 *  - **A way to a person**: top right, the word "Help" with a
 *    question-mark-in-circle. Never buried in More.
 *  - The blue band itself, which is what makes a task screen look like the
 *    sign-in flow the person already learned.
 *
 * Every icon here is paired with its word (P3, §5.5).
 */

export interface TaskHeaderProps {
  title: string;
  onBack: () => void;
  /** Identifies the screen to the help sheet so support knows where they are. */
  screenName: string;
  /** A count or status pill, shown under the title rather than beside it. */
  subtitle?: React.ReactNode;
  /** Set false on the rare screen where help would interrupt a payment. */
  showHelp?: boolean;
  className?: string;
}

const BACK_LABEL = 'Back';
const HELP_LABEL = 'Help';

export function TaskHeader({
  title,
  onBack,
  screenName,
  subtitle,
  showHelp = true,
  className,
}: TaskHeaderProps) {
  const [helpOpen, setHelpOpen] = React.useState(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-20 bg-[var(--pd-blue)] text-white px-4 pt-2 pb-4 shadow-xs',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] px-2 -ml-2 flex items-center gap-1.5 text-[16px] font-extrabold text-white/90 hover:text-white active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" strokeWidth={2.5} />
            <span>{BACK_LABEL}</span>
          </button>

          {showHelp && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="min-h-[48px] px-2 -mr-2 flex items-center gap-1.5 text-[16px] font-extrabold text-white/90 hover:text-white active:scale-95 transition-transform cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" strokeWidth={2.5} />
              <span>{HELP_LABEL}</span>
            </button>
          )}
        </div>

        <h1 className="text-[30px] font-extrabold tracking-tight m-0 mt-1 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 text-[16px] font-semibold text-white/80">{subtitle}</div>
        )}
      </header>

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName={screenName} />
    </>
  );
}
