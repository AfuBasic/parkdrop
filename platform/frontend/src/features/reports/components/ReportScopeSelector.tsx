import { MapPin, ChevronDown } from 'lucide-react';
import { ReportsStrings } from '@/features/reports/strings';

interface PickupPointOption {
  id: number;
  name: string;
}

interface ReportScopeSelectorProps {
  pickupPoints: PickupPointOption[];
  currentScope: 'all' | number;
  onScopeChange: (scope: 'all' | number) => void;
}

export function ReportScopeSelector({
  pickupPoints,
  currentScope,
  onScopeChange,
}: ReportScopeSelectorProps) {
  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 px-3 min-h-[48px] rounded-[var(--pd-field-radius)] border border-[var(--pd-line-2)] bg-white text-[15px] font-bold text-[var(--pd-navy)] cursor-pointer">
        <MapPin className="w-4 h-4 text-[var(--pd-blue)] shrink-0" strokeWidth={2.25} aria-hidden="true" />
        <select
          value={currentScope === 'all' ? 'all' : currentScope}
          onChange={(e) => {
            const val = e.target.value;
            onScopeChange(val === 'all' ? 'all' : Number(val));
          }}
          className="appearance-none bg-transparent pr-4 font-bold text-[var(--pd-navy)] text-[15px] cursor-pointer focus:outline-none"
          aria-label="Select report location scope"
        >
          <option value="all">{ReportsStrings.allPickupPoints}</option>
          {pickupPoints.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-[var(--pd-muted)] pointer-events-none -ml-3" aria-hidden="true" />
      </div>
    </div>
  );
}
