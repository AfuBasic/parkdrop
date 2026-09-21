import { MapPin, ChevronDown } from 'lucide-react';

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
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-default hover:bg-surface-subtle transition-colors text-xs font-semibold text-text-primary cursor-pointer">
        <MapPin className="w-3.5 h-3.5 text-action-primary shrink-0" />
        <select
          value={currentScope === 'all' ? 'all' : currentScope}
          onChange={(e) => {
            const val = e.target.value;
            onScopeChange(val === 'all' ? 'all' : Number(val));
          }}
          className="appearance-none bg-transparent pr-4 font-semibold text-text-primary text-xs cursor-pointer focus:outline-none"
          aria-label="Select report location scope"
        >
          <option value="all">All pickup points (Business-wide)</option>
          {pickupPoints.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted pointer-events-none -ml-3" />
      </div>
    </div>
  );
}
