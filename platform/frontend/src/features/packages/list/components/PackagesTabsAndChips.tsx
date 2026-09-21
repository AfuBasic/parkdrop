import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PackagesStrings } from '@/features/packages/strings';
import type {
  StatusTab,
  WaitingFilterChip,
  CollectedFilterChip,
  OtherFilterChip,
} from '@/features/packages/domain/package-filters';

export interface PackagesTabsAndChipsProps {
  activeTab: StatusTab;
  onSelectTab: (tab: StatusTab) => void;
  waitingCounts: { total: number; unpaid: number; age3d: number; age7d: number };
  collectedCounts: { total: number; today: number; week: number; owing: number };
  otherCounts: { total: number; returned: number; cancelled: number };
  waitingChips: Set<WaitingFilterChip>;
  onToggleWaitingChip: (chip: WaitingFilterChip) => void;
  collectedChips: Set<CollectedFilterChip>;
  onToggleCollectedChip: (chip: CollectedFilterChip) => void;
  otherChips: Set<OtherFilterChip>;
  onToggleOtherChip: (chip: OtherFilterChip) => void;
}

export function PackagesTabsAndChips({
  activeTab,
  onSelectTab,
  waitingCounts,
  collectedCounts,
  otherCounts,
  waitingChips,
  onToggleWaitingChip,
  collectedChips,
  onToggleCollectedChip,
  otherChips,
  onToggleOtherChip,
}: PackagesTabsAndChipsProps) {
  const tabs: Array<{ id: StatusTab; label: string; count: number }> = [
    { id: 'WAITING', label: PackagesStrings.tabWaiting, count: waitingCounts.total },
    { id: 'COLLECTED', label: PackagesStrings.tabCollected, count: collectedCounts.total },
    { id: 'OTHER', label: PackagesStrings.tabOther, count: otherCounts.total },
  ];

  return (
    <div className="flex-none bg-white border-b border-[var(--pd-line-2)] flex flex-col">
      {/* 3 Status Tabs: 52px min-height, mutually exclusive, always visible */}
      <div
        className="w-full flex items-center border-b border-[var(--pd-line-2)]"
        role="tablist"
        aria-label="Package status tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id.toLowerCase()}`}
              aria-controls={`panel-${tab.id.toLowerCase()}`}
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                'flex-1 min-h-[52px] py-3 px-2 flex items-center justify-center gap-1.5 transition-colors relative cursor-pointer',
                isActive
                  ? 'text-[var(--pd-blue)] font-extrabold bg-[var(--pd-tint)]/40'
                  : 'text-[var(--pd-muted)] font-bold hover:text-[var(--pd-navy)]'
              )}
            >
              <span className="text-[16px] leading-none">{tab.label}</span>
              <span
                className={cn(
                  'text-[13px] px-2 py-0.5 rounded-full font-bold tabular-nums',
                  isActive
                    ? 'bg-[var(--pd-blue)] text-white'
                    : 'bg-[var(--pd-page)] text-[var(--pd-muted)] border border-[var(--pd-line)]'
                )}
              >
                {tab.count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[var(--pd-blue)] rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Chips Container: 48px touch targets */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Waiting Tab Chips */}
        {activeTab === 'WAITING' && (
          <>
            <FilterChipButton
              label={`${PackagesStrings.chipUnpaid} ${waitingCounts.unpaid}`}
              active={waitingChips.has('unpaid')}
              onClick={() => onToggleWaitingChip('unpaid')}
            />
            <FilterChipButton
              label={`${PackagesStrings.chipAge3d} ${waitingCounts.age3d}`}
              active={waitingChips.has('3d')}
              onClick={() => onToggleWaitingChip('3d')}
            />
            <FilterChipButton
              label={`${PackagesStrings.chipAge7d} ${waitingCounts.age7d}`}
              active={waitingChips.has('7d')}
              onClick={() => onToggleWaitingChip('7d')}
            />
          </>
        )}

        {/* Collected Tab Chips */}
        {activeTab === 'COLLECTED' && (
          <>
            <FilterChipButton
              label={`${PackagesStrings.chipToday} ${collectedCounts.today}`}
              active={collectedChips.has('today')}
              onClick={() => onToggleCollectedChip('today')}
            />
            <FilterChipButton
              label={`${PackagesStrings.chipThisWeek} ${collectedCounts.week}`}
              active={collectedChips.has('week')}
              onClick={() => onToggleCollectedChip('week')}
            />
            <FilterChipButton
              label={`${PackagesStrings.chipOwing} ${collectedCounts.owing}`}
              active={collectedChips.has('owing')}
              onClick={() => onToggleCollectedChip('owing')}
            />
          </>
        )}

        {/* Other Tab Chips (Returned / Cancelled) */}
        {activeTab === 'OTHER' && (
          <>
            <FilterChipButton
              label={`${PackagesStrings.chipReturned} ${otherCounts.returned}`}
              active={otherChips.has('returned')}
              onClick={() => onToggleOtherChip('returned')}
            />
            <FilterChipButton
              label={`${PackagesStrings.chipCancelled} ${otherCounts.cancelled}`}
              active={otherChips.has('cancelled')}
              onClick={() => onToggleOtherChip('cancelled')}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface FilterChipButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChipButton({ label, active, onClick }: FilterChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[48px] px-3.5 py-2 rounded-full border text-[15px] font-extrabold inline-flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer select-none',
        active
          ? 'bg-[var(--pd-blue)] text-white border-[var(--pd-blue)] shadow-xs'
          : 'bg-[var(--pd-page)] text-[var(--pd-navy)] border-[var(--pd-line)] hover:border-[var(--pd-blue)]'
      )}
    >
      {active && <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
